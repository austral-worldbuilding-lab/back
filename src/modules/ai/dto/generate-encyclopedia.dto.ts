import { ApiProperty } from '@nestjs/swagger';

export class GenerateEncyclopediaDto {
  @ApiProperty({
    description: 'Array of selected file names to filter context (optional)',
    example: ['archivo1.pdf', 'archivo2.docx'],
    required: false,
  })
  selectedFiles?: string[];
}

export class AiEncyclopediaResponseDto {
  @ApiProperty({
    description: 'The comprehensive encyclopedia of the project world',
    example: 'Esta es la enciclopedia completa del mundo del proyecto...',
  })
  encyclopedia!: string;
}
