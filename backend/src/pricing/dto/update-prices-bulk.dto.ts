import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SlotPriceDto {
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsNumber()
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;
}

export class UpdatePricesBulkDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SlotPriceDto)
  prices: SlotPriceDto[];
}
