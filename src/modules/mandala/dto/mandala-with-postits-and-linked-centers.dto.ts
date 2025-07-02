import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { MandalaDto } from './mandala.dto';

class PositionDto {
  @ApiProperty({
    description: 'X coordinate',
    example: 0.5,
  })
  @IsNumber()
  x!: number;

  @ApiProperty({
    description: 'Y coordinate',
    example: 0.5,
  })
  @IsNumber()
  y!: number;
}

class PostitTagDto {
  @ApiProperty({
    description: 'Tag name',
    example: 'Urgent',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Tag color',
    example: '#FF0000',
  })
  @IsHexColor()
  @IsNotEmpty()
  color!: string;
}

class PostitDto {
  @ApiProperty({
    description: 'Post-it ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Post-it content',
    example: 'This is a post-it',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'Post-it dimension',
    example: 'Culture',
  })
  @IsString()
  @IsNotEmpty()
  dimension!: string;

  @ApiProperty({
    description: 'Post-it section',
    example: 'Community',
  })
  @IsString()
  @IsNotEmpty()
  section!: string;

  @ApiProperty({
    description: 'Post-it tags',
    type: [PostitTagDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostitTagDto)
  tags!: PostitTagDto[];

  @ApiProperty({
    description: 'Child post-its',
    type: () => [PostitWithCoordinatesDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostitWithCoordinatesDto)
  childrens!: PostitWithCoordinatesDto[];
}

export class PostitWithCoordinatesDto extends PostitDto {
  @ApiProperty({
    description: 'Post-it coordinates',
    type: PositionDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PositionDto)
  coordinates!: PositionDto;
}

export class ChildMandalaCenterDto {
  @ApiProperty({
    description: 'Name of the child mandala center',
    example: 'Child Mandala',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Description of the child mandala center',
    example: 'A description of the child mandala',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Color of the child mandala center',
    example: '#FF0000',
  })
  @IsHexColor()
  @IsNotEmpty()
  color!: string;

  @ApiProperty({
    description: 'Position of the child mandala center',
    type: PositionDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PositionDto)
  position!: PositionDto;

  @ApiProperty({
    description: 'Section of the child mandala center',
    example: 'Community',
  })
  @IsString()
  @IsNotEmpty()
  section!: string;

  @ApiProperty({
    description: 'Dimension of the child mandala center',
    example: 'Culture',
  })
  @IsString()
  @IsNotEmpty()
  dimension!: string;
}

export class MandalaWithPostitsAndLinkedCentersDto {
  @ApiProperty({
    description: 'The main mandala data',
    type: MandalaDto,
  })
  @ValidateNested()
  @Type(() => MandalaDto)
  mandala!: MandalaDto;

  @ApiProperty({
    description: 'List of post-its with coordinates',
    type: [PostitWithCoordinatesDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostitWithCoordinatesDto)
  postits!: PostitWithCoordinatesDto[];

  @ApiProperty({
    description: 'List of linked child mandala centers',
    type: [ChildMandalaCenterDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildMandalaCenterDto)
  childrenCenter!: ChildMandalaCenterDto[];
}
