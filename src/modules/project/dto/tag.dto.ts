import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class TagDto {
  @ApiProperty({
    description: 'Identificador único del tag',
    example: 'ab12cd34-ef56-7890-ab12-cd34ef567890',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description:
      'Nombre del tag. Describe la categoría o contexto del post-it.',
    example: 'Comedor',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description:
      'Color del tag en formato hexadecimal. Se utiliza para visualizar el tag de forma distintiva.',
    example: '#3B82F6',
  })
  @IsString()
  @IsNotEmpty()
  @IsHexColor()
  color!: string;

  @ApiProperty({
    description: 'ID del proyecto al que pertenece este tag.',
    example: 'de45fa12-bc34-4567-89de-f01234abcd56',
  })
  @IsUUID()
  projectId!: string;
}
