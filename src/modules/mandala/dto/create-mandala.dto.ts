import { DimensionDto } from '@common/dto/dimension.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  ArrayMinSize,
  ValidateNested,
  IsHexColor,
} from 'class-validator';

export class CreateMandalaCenterDto {
  @ApiProperty({
    description: 'Nombre del personaje central',
    example: 'Estudiante',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Descripción del personaje central',
    example: 'Alumno de 23 años que estudia en la universidad',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Color del personaje central en formato hexadecimal',
    example: '#3B82F6',
  })
  @IsHexColor()
  @IsNotEmpty()
  color!: string;
}
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
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Personaje central del mandala',
    type: CreateMandalaCenterDto,
  })
  @ValidateNested()
  @Type(() => CreateMandalaCenterDto)
  @IsNotEmpty()
  center!: CreateMandalaCenterDto;

  @ApiProperty({
    description: 'Dimensiones del mandala',
    type: [DimensionDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DimensionDto)
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

  @ApiProperty({
    description: 'ID del mandala padre al que está vinculado este mandala',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string | null;
}
