import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsUUID } from 'class-validator';

import { OverlapMandalaDto } from './overlap-mandala.dto';

export class OverlapResultDto {
  @ApiProperty({
    description:
      'El nuevo mandala creado a partir de la unión de todos los mandalas de entrada',
    type: OverlapMandalaDto,
  })
  @ValidateNested()
  @Type(() => OverlapMandalaDto)
  mandala!: OverlapMandalaDto;

  @ApiProperty({
    description: 'Número de mandalas que fueron fusionados',
    example: 3,
  })
  mergedCount!: number;

  @ApiProperty({
    description: 'IDs de los mandalas fuente que fueron fusionados',
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  sourceMandalaIds!: string[];
}
