const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain
const safeStorage = electron.safeStorage
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const crypto = require('crypto')

let mainWindow = null
let backendProcess = null
let frontendProcess = null
let configPath = null

function getConfigPath() {
  if (!configPath) {
    configPath = path.join(app.getPath('userData'), 'config.enc')
  }
  return configPath
}

function saveConfig(data) {
  const encrypted = safeStorage.encryptString(JSON.stringify(data))
  fs.writeFileSync(getConfigPath(), encrypted)
}

function loadConfig() {
  const p = getConfigPath()
  if (!fs.existsSync(p)) return null
  const encrypted = fs.readFileSync(p)
  return JSON.parse(safeStorage.decryptString(encrypted))
}

function configExists() {
  return fs.existsSync(getConfigPath())
}

function createSetupWindow() {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  })
  mainWindow.loadFile('setup.html')
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: { nodeIntegration: false },
    autoHideMenuBar: true,
  })
  mainWindow.loadURL('http://localhost:3000')
}

function startBackend(db, jwt) {
  const dbUrl = `mysql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`

  // Determine backend path based on whether we're packaged or in development
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '../backend')

  // Use 'start:dev' in development, 'start' in production
  const startScript = app.isPackaged ? 'start' : 'start:dev'

  backendProcess = spawn('npm', ['run', startScript], {
    cwd: backendPath,
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
      JWT_SECRET: jwt,
      PORT: '3001',
    }
  })

  backendProcess.stdout.on('data', d => console.log('Backend:', d.toString()))
  backendProcess.stderr.on('data', d => console.log('Backend:', d.toString()))
}

function startFrontend() {
  // Determine frontend path based on whether we're packaged or in development
  const frontendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'frontend')
    : path.join(__dirname, '../frontend')

  // Use 'dev' in development, 'start' in production
  const startScript = app.isPackaged ? 'start' : 'dev'

  frontendProcess = spawn('npm', ['run', startScript], {
    cwd: frontendPath,
    shell: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: 'http://localhost:3001/api'
    }
  })

  frontendProcess.stdout.on('data', d => console.log('Frontend:', d.toString()))
  frontendProcess.stderr.on('data', d => console.log('Frontend:', d.toString()))
}

app.on('ready', async () => {
  // Register IPC handlers
  ipcMain.handle('database:test', async (_e, cfg) => {
    try {
      const mysql = require('mysql2/promise')

      // First connect without database to create it if needed
      const conn = await mysql.createConnection({
        host: cfg.host,
        port: cfg.port,
        user: cfg.username,
        password: cfg.password,
      })

      // Create database if it doesn't exist
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${cfg.database}\``)
      await conn.end()

      // Now test connection to the specific database
      const dbConn = await mysql.createConnection({
        host: cfg.host,
        port: cfg.port,
        user: cfg.username,
        password: cfg.password,
        database: cfg.database,
      })
      await dbConn.end()

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('database:migrate', async (_e, cfg) => {
    const dbUrl = `mysql://${cfg.username}:${cfg.password}@${cfg.host}:${cfg.port}/${cfg.database}`

    const backendPath = app.isPackaged
      ? path.join(process.resourcesPath, 'backend')
      : path.join(__dirname, '../backend')

    return new Promise((resolve, reject) => {
      let output = ''
      let errorOutput = ''

      // Use 'db push' instead of 'migrate deploy' - it applies schema directly without migration files
      const proc = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss', '--skip-generate'], {
        cwd: backendPath,
        shell: true,
        env: { ...process.env, DATABASE_URL: dbUrl }
      })

      proc.stdout.on('data', (data) => {
        output += data.toString()
        console.log('Migration:', data.toString())
      })

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString()
        console.error('Migration Error:', data.toString())
      })

      proc.on('close', code => {
        if (code === 0) {
          resolve({ success: true })
        } else {
          reject(new Error(`Schema push failed (code ${code}): ${errorOutput || output}`))
        }
      })

      setTimeout(() => {
        proc.kill()
        reject(new Error('Schema push timeout after 3 minutes'))
      }, 180000)
    })
  })

  ipcMain.handle('db:createAdmin', async (_e, data) => {
    try {
      const bcrypt = require('bcrypt')
      const mysql = require('mysql2/promise')

      // Use the dbConfig passed from the wizard
      const dbConfig = data.dbConfig

      const conn = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
      })

      const hash = await bcrypt.hash(data.password, 12)

      await conn.execute(
        `INSERT INTO users (id, name, email, password, role, locale, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'SUPER_ADMIN', ?, true, NOW(), NOW())`,
        [crypto.randomBytes(12).toString('base64url'), data.name, data.email, hash, data.locale || 'ar']
      )

      await conn.end()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('setup:complete', async (_e, cfg) => {
    try {
      if (!cfg.jwtSecret) {
        cfg.jwtSecret = crypto.randomBytes(64).toString('hex')
      }

      saveConfig(cfg)

      if (mainWindow) mainWindow.close()

      startBackend(cfg.database, cfg.jwtSecret)
      startFrontend()

      await new Promise(r => setTimeout(r, 3000))

      createMainWindow()

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  // Start app
  if (!configExists()) {
    createSetupWindow()
  } else {
    const cfg = loadConfig()
    startBackend(cfg.database, cfg.jwtSecret)
    startFrontend()
    await new Promise(r => setTimeout(r, 3000))
    createMainWindow()
  }
})

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill()
  if (frontendProcess) frontendProcess.kill()
  app.quit()
})
