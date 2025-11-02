import { ApiProperty } from '@nestjs/swagger';

export class DeliverableDto {
  @ApiProperty({
    description: 'File name of the deliverable',
    example: 'Enciclopedia del mundo - My Project.md',
  })
  fileName!: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'text/markdown',
  })
  fileType!: string;

  @ApiProperty({
    description: 'Public URL to access the deliverable file',
    example:
      'https://storageaccount.blob.core.windows.net/container/org/org-id/project/project-id/deliverables/encyclopedia.md',
  })
  url!: string;
}

