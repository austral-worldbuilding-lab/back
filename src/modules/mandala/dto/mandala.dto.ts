import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { CreateMandalaConfiguration } from '../types/mandala-configuration.type';
import { MandalaType } from '../types/mandala-type.enum';

export class MandalaDto {
  @ApiProperty({
    description: 'ID único del mandala',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Nombre del mandala',
    example: 'Mandala del Sistema UA',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Type of mandala based on its function in the system',
    enum: MandalaType,
    example: MandalaType.UNIFIED,
  })
  @IsEnum(MandalaType)
  type!: MandalaType;

  @ApiProperty({
    description: 'ID of the project to which the mandala belongs',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'Mandala configuration',
    type: CreateMandalaConfiguration,
  })
  @ValidateNested()
  @Type(() => CreateMandalaConfiguration)
  configuration!: CreateMandalaConfiguration;

  @ApiProperty({
    description:
      'IDs of child mandalas (mandalas that are characters in this mandala)',
    type: [String],
    example: [
      'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
    ],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  childrenIds!: string[];

  @ApiProperty({
    description:
      'IDs of parent mandalas (mandalas in which this one is a character)',
    type: [String],
    example: [
      'c3d4e5f6-a7b8-9012-3456-7890abcdef12',
      'd4e5f6a7-b8c9-0123-4567-890abcdef123',
    ],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  parentIds!: string[];

  @ApiProperty({
    description: 'Mandala creation date',
    example: '2023-01-01T12:00:00.000Z',
  })
  @IsDate()
  createdAt!: Date;

  @ApiProperty({
    description: 'Mandala last update date',
    example: '2023-01-02T12:00:00.000Z',
  })
  @IsDate()
  updatedAt!: Date;
}
