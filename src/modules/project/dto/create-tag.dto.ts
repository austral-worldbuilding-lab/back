import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    description: 'Nombre del tag. Debe ser único dentro del proyecto.',
    example: 'Comedor',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name!: string;

  @ApiProperty({
    description: 'Color del tag en formato hexadecimal (ej. #3B82F6)',
    example: '#3B82F6',
  })
  @IsString()
  @IsHexColor()
  color!: string;
}
