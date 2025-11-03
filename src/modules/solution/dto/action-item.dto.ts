import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

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
  title!: string;

  @ApiProperty({
    description: 'Description of the action item',
    example: 'Conduct a community workshop to raise awareness about recycling.',
  })
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Duration of the action item',
    example: '2 weeks',
    required: false,
  })
  @IsString()
  duration?: string;
}
