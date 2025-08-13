import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AiQuestionResponseDto {
  @ApiProperty({
    description: 'The generated question text',
    example: '¿Cómo afecta la economía local a la cultura de la comunidad?',
  })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiProperty({
    description: 'The dimension this question relates to',
    example: 'ECONOMÍA',
  })
  @IsString()
  @IsNotEmpty()
  dimension!: string;

  @ApiProperty({
    description: 'The scale this question relates to',
    example: 'CIUDAD',
  })
  @IsString()
  @IsNotEmpty()
  scale!: string;
}
