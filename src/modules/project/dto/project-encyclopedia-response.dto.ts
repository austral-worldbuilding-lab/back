import { ApiProperty } from '@nestjs/swagger';

export class ProjectEncyclopediaResponseDto {
  @ApiProperty({
    description: 'The comprehensive encyclopedia of the project world',
  })
  encyclopedia!: string;

  @ApiProperty({
    description: 'URL to access the saved encyclopedia file in blob storage',
    example: 'https://storageaccount.blob.core.windows.net/container/org/org-id/project/project-id/encyclopedia/encyclopedia-2024-01-15T10-30-45-123Z.md',
  })
  storageUrl!: string;
}
