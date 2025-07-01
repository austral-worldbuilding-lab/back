import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @IsNotEmpty()
  @IsString()
  color!: string;
}
