import { IsOptional, IsInt, Min, Max, IsString, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search query must not exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_.@]*$/, { message: 'Search query contains invalid characters' })
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
