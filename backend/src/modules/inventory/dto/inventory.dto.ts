import { IsString, IsOptional, IsNumber, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class AdjustStockDto {
  @IsString()
  productId: string

  @IsString()
  branchId: string

  @Type(() => Number) @IsNumber() @Min(0)
  quantity: number

  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  minStock?: number

  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  costPrice?: number
}

export class CreateTransferDto {
  @IsString()
  fromBranchId: string

  @IsString()
  toBranchId: string

  @IsString()
  userId: string

  @IsString() @IsOptional()
  notes?: string

  items: { productId: string; quantity: number }[]
}
