import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsUUID } from 'class-validator';

import { MandalaDto } from './mandala.dto';
import { OverlapMandalaCenterDto } from './overlap-mandala-center.dto';

export class OverlapResultDto {
  @ApiProperty({
    description:
      'El nuevo mandala creado a partir de la unión de todos los mandalas de entrada',
    type: MandalaDto,
  })
  @ValidateNested()
  @Type(() => MandalaDto)
  mandala!: MandalaDto;

  @ApiProperty({
    description:
      'Todos los caracteres centrales originales de los mandalas superpuestos',
    type: OverlapMandalaCenterDto,
  })
  @ValidateNested()
  @Type(() => OverlapMandalaCenterDto)
  centers!: OverlapMandalaCenterDto;

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
