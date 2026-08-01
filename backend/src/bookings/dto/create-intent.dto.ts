import {
  IsDateString,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class CreateIntentDto {
  @IsDateString({}, { message: 'La fecha debe tener formato válido (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  date: string;

  @IsString()
  @IsNotEmpty({ message: 'El horario es obligatorio' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'El horario debe tener formato HH:MM' })
  startTime: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  clientName: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono del cliente es obligatorio' })
  clientPhone: string;
}
