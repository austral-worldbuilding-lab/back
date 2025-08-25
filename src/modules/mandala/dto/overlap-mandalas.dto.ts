import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsUUID,
  ArrayMinSize,
  IsNotEmpty,
  IsString,
  IsHexColor,
} from 'class-validator';

export class OverlapMandalasDto {
  @ApiProperty({
    description: 'Nombre del nuevo mandala superpuesto',
    example: 'Mandala Superpuesto',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
  @ApiProperty({
    description: 'Color del personaje central en formato hexadecimal',
    example: '#3B82F6',
  })
  @IsHexColor()
  @IsNotEmpty()
  color!: string;
  @ApiProperty({
    description:
      'Array de IDs de mandalas para superponer (mínimo 2). Todos los mandalas deben tener las mismas dimensiones y escalas. El nuevo mandala superpuesto se guardará en el proyecto del primer mandala de la lista.',
    type: [String],
    example: [
      'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
    ],
    minItems: 2,
  })
  @IsArray()
  @ArrayMinSize(2, {
    message: 'Se requieren al menos 2 IDs de mandalas para la superposición',
  })
  @IsUUID(undefined, {
    each: true,
    message: 'Cada ID de mandala debe ser un UUID válido',
  })
  mandalas!: string[];
}
