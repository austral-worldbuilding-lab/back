import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
  IsObject,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTagDto } from '@/modules/project/dto/create-tag.dto';

class PostitCoordinatesDto {
  @ApiProperty({
    description: 'X coordinate of the post-it',
    example: 0.5,
  })
  @IsNumber()
  x!: number;

  @ApiProperty({
    description: 'Y coordinate of the post-it',
    example: 0.3,
  })
  @IsNumber()
  y!: number;

  @ApiProperty()
  @IsNumber()
  angle!: number;

  @ApiProperty()
  @IsNumber()
  percentileDistance!: number;
}

export class  CreatePostitDto {
  @ApiProperty({
    description: 'Content of the post-it',
    example: 'This is a sample post-it content',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'Coordinates of the post-it',
    type: PostitCoordinatesDto,
  })
  @ValidateNested()
  @Type(() => PostitCoordinatesDto)
  @IsObject()
  coordinates!: PostitCoordinatesDto;

  @ApiProperty({
    description: 'Dimension of the post-it',
    example: 'Resources',
  })
  @IsString()
  @IsNotEmpty()
  dimension!: string;

  @ApiProperty({
    description: 'Section of the post-it',
    example: 'Person',
  })
  @IsString()
  @IsNotEmpty()
  section!: string;

  @ApiProperty({
    description: 'Tags associated with the post-it',
    type: [CreateTagDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateTagDto)
  @IsArray()
  tags!: CreateTagDto[];

  @ApiProperty({
    description: 'ID of the parent post-it (optional)',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
