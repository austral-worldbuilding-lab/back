import { ApiProperty } from '@nestjs/swagger';

import { FileSource } from '../types/file-scope.type';

export class EffectiveFileDto {
  @ApiProperty({
    description: 'Nombre del archivo',
    example: 'documento.pdf',
  })
  file_name!: string;

  @ApiProperty({
    description: 'Tipo de archivo (MIME type)',
    example: 'application/pdf',
  })
  file_type!: string;

  @ApiProperty({
    description: 'Origen del archivo en la jerarquía',
    enum: ['org', 'project', 'mandala'],
    example: 'org',
  })
  source_scope!: FileSource;

  @ApiProperty({
    description: 'Ruta completa del archivo en el almacenamiento',
    example: 'org/805a5584-32de-4bdf-9f53-8b3ace7a21dc/files/documento.pdf',
  })
  full_path!: string;

  @ApiProperty({
    description: 'URL de descarga del archivo con acceso temporal',
    example:
      'https://storage.blob.core.windows.net/container/org/123/files/documento.pdf?sv=2021-06-08&se=2024-01-01T12:00:00Z&sr=b&sp=r&sig=...',
  })
  url!: string;
}
