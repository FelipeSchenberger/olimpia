import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PromoPriceItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  subtitle: string;

  @IsString()
  @IsNotEmpty()
  price: string;
}

export class UpdatePromoPricesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromoPriceItemDto)
  items: PromoPriceItemDto[];
}
