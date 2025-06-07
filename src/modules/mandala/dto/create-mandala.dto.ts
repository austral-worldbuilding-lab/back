import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMandalaDto {
  @ApiProperty({
    description: 'Nombre del mandala',
    example: 'Mandala del Sistema UA',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'ID del proyecto al que pertenece el mandala',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Dimensiones del mandala. Si no se proporcionan, se usarán las dimensiones del proyecto.',
    example: [
      'Recursos',
      'Cultura',
      'Infraestructura',
      'Economía',
      'Gobierno',
      'Ecología',
    ],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(1, { message: 'Las dimensiones no pueden estar vacías si se proporcionan' })
  dimensions?: string[];

  @ApiProperty({
    description: 'Escalas del mandala. Si no se proporcionan, se usarán las escalas del proyecto.',
    example: ['Persona', 'Comunidad', 'Institución'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(1, { message: 'Las escalas no pueden estar vacías si se proporcionan' })
  scales?: string[];
}
