import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SlotPriceDto {
  @IsOptional()
  id?: number;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsNumber()
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Type(() => Number)
  price: number;

  @IsOptional()
  updatedAt?: any;

  @IsOptional()
  createdAt?: any;
}

export class UpdatePricesBulkDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SlotPriceDto)
  prices: SlotPriceDto[];
}
