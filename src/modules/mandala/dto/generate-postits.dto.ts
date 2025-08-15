import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class GeneratePostitsDto {
  @ApiProperty({
    description:
      'Array of dimensions to generate postits for. If not provided, uses all mandala dimensions.',
    example: ['ECOLOGÍA', 'GOBIERNO', 'ECONOMÍA'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dimensions?: string[];

  @ApiProperty({
    description:
      'Array of scales to generate postits for. If not provided, uses all mandala scales.',
    example: ['MI ESQUINA', 'CIUDAD / BARRIO', 'PROVINCIA', 'PAÍS'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scales?: string[];
}
