import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';

export class DimensionDto {
  @ApiProperty({
    description: 'Nombre de la dimensión',
    example: 'Recursos',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Color de la dimensión en formato hexadecimal',
    example: '#FF0000',
  })
  @IsHexColor()
  @IsNotEmpty()
  color!: string;
}
