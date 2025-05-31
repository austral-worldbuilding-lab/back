import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFileDto {
  @ApiProperty({
    description: 'Nombre del archivo',
    example: 'document.pdf',
  })
  @IsNotEmpty()
  @IsString()
  file_name!: string;

  @ApiProperty({
    description: 'Tipo de archivo (MIME type)',
    example: 'application/pdf',
  })
  @IsNotEmpty()
  @IsString()
  file_type!: string;
}
