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
}
