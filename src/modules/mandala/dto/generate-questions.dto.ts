import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class GenerateQuestionsDto {
  @ApiProperty({
    description: 'Array of dimensions to generate questions for. If not provided, uses all mandala dimensions.',
    example: ['ECOLOGIA', 'GOBIERNO', 'ECONOMIA'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dimensions?: string[];

  @ApiProperty({
    description: 'Array of scales to generate questions for. If not provided, uses all mandala scales.',
    example: ['CIUDAD', 'PROVINCIA', 'PAIS'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scales?: string[];
}
