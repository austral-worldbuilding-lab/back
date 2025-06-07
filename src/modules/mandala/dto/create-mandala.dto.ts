import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DimensionDto } from '@common/dto/dimension.dto';

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
    description: 'Dimensiones del mandala',
    example: [
      { name: 'Recursos', color: '#FF0000' },
      { name: 'Cultura', color: '#00FF00' },
      { name: 'Infraestructura', color: '#0000FF' },
      { name: 'Economía', color: '#FFFF00' },
      { name: 'Gobierno', color: '#FF00FF' },
      { name: 'Ecología', color: '#00FFFF' },
    ],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1, {
    message: 'Las dimensiones no pueden estar vacías si se proporcionan',
  })
  dimensions?: DimensionDto[];

  @ApiProperty({
    description: 'Escalas del mandala',
    example: ['Persona', 'Comunidad', 'Institución'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(1, {
    message: 'Las escalas no pueden estar vacías si se proporcionan',
  })
  scales?: string[];
}
