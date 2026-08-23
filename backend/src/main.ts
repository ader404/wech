import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { getUploadsDir } from './common/uploads-path'
import helmet from 'helmet'


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const logger = new Logger('Bootstrap')


  // Security headers. This backend only ever serves the local desktop app over
  // plain HTTP on 127.0.0.1, so HSTS (which instructs browsers to require HTTPS
  // for this host) is meaningless here and CSP is left on since the local
  // frontend still benefits from it.
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      hsts: false,
    }),
  )

  // CORS - allow all origins for desktop app (both frontend and backend run locally)
  app.enableCors({
    origin: true,
    credentials: true,
  })

  app.useStaticAssets(getUploadsDir(), { prefix: '/uploads' })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )

  app.setGlobalPrefix('api')

  const config = new DocumentBuilder()
    .setTitle('Retail CRM API')
    .setDescription('Multi-branch CRM + POS + Inventory API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 3001
  // Bind explicitly to localhost only. This is a desktop app's local backend —
  // it must never be reachable from the LAN, only from the Electron-hosted
  // frontend running on the same machine.
  const host = process.env.HOST || '127.0.0.1'
  await app.listen(port, host)
  logger.log(`Application running on ${host}:${port}`)
}

bootstrap()
