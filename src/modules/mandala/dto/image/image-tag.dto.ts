import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImageTagDto {
  @ApiProperty({
    description: 'Nombre del tag',
    example: 'Importante',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description:
      'Color del tag en formato hexadecimal. Si no se proporciona, se generará automáticamente.',
    example: '#3B82F6',
    required: false,
  })
  @IsString()
  @IsHexColor()
  @IsOptional()
  color?: string;
}
