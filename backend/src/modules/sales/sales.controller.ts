import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.salesService.findAll(paginationDto);
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.salesService.findOne(id); }
  @Post() create(@Body() dto: CreateSaleDto) { return this.salesService.create(dto); }
  @Post('payments') addPayment(@Body() dto: AddPaymentDto) { return this.salesService.addPayment(dto); }
  @Patch(':id/refund') refund(@Param('id') id: string) { return this.salesService.refund(id); }
  @Delete(':id') delete(@Param('id') id: string) { return this.salesService.delete(id); }
  @Patch(':id/payment-status') updatePaymentStatus(
    @Param('id') id: string,
    @Body('status') status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID',
  ) {
    return this.salesService.updatePaymentStatus(id, status);
  }
}
