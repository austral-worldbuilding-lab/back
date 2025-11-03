import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ActionItemDto {
  @ApiProperty({
    description: 'Number indicating the order of the action item',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  order!: number;

  @ApiProperty({
    description: 'Title of the action item',
    example: 'Organize a Community Workshop',
  })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Description of the action item',
    example: 'Conduct a community workshop to raise awareness about recycling.',
  })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Duration of the action item',
    example: '2 weeks',
    required: false,
  })
  @IsString()
  @IsOptional()
  duration?: string;
}
