import { DimensionDto } from '@common/dto/dimension.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

import { CreateMandalaCenterDto } from '@/modules/mandala/dto/create-mandala.dto';

export class CreateMandalaConfiguration {
  @ApiProperty({
    description: 'Centro del mandala',
    type: CreateMandalaCenterDto,
  })
  @ValidateNested()
  @Type(() => CreateMandalaCenterDto)
  center!: CreateMandalaCenterDto;

  @ApiProperty({
    description: 'Dimensiones del mandala',
    type: [DimensionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DimensionDto)
  dimensions!: DimensionDto[];

  @ApiProperty({
    description: 'Escalas del mandala',
    type: [String],
    example: ['Persona', 'Comunidad', 'Institución'],
  })
  @IsArray()
  @IsString({ each: true })
  scales!: string[];
}
