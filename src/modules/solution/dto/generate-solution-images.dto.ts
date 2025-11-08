import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GenerateSolutionImagesDto {
  @ApiProperty({
    description: 'Solution ID for which to generate images',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  solutionId!: string;
}

export class GenerateSolutionImagesResponseDto {
  @ApiProperty({
    description: 'List of public URLs for the generated images',
    example: [
      'https://storageaccount.blob.core.windows.net/container/org/org-id/project/project-id/deliverables/solution-solution-id-0-dimension-scale.png',
    ],
    type: [String],
  })
  urls!: string[];
}
