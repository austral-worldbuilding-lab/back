import { ApiProperty } from '@nestjs/swagger';

export class UsefulResourceDto {
  @ApiProperty({
    description: 'Nombre del archivo',
    example: 'ejemplo.pdf',
  })
  file_name!: string;

  @ApiProperty({
    description:
      'Tipo de archivo (MIME type) o tipo especial para enlaces externos',
    example: 'application/pdf',
  })
  file_type!: string;

  @ApiProperty({
    description: 'URL pública del recurso',
    example:
      'https://account.blob.core.windows.net/container/useful-resources/ejemplo.pdf',
  })
  url!: string;
}
