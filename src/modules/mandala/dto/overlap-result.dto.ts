import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsUUID } from 'class-validator';

import { MandalaDto } from './mandala.dto';
import { OverlapMandalaCenterDto } from './overlap-mandala-center.dto';

export class OverlapResultDto {
  @ApiProperty({
    description: 'The new mandala created from the union of all input mandalas',
    type: MandalaDto,
  })
  @ValidateNested()
  @Type(() => MandalaDto)
  mandala!: MandalaDto;

  @ApiProperty({
    description: 'All original center characters from the overlapped mandalas',
    type: OverlapMandalaCenterDto,
  })
  @ValidateNested()
  @Type(() => OverlapMandalaCenterDto)
  centers!: OverlapMandalaCenterDto;

  @ApiProperty({
    description: 'Number of mandalas that were merged',
    example: 3,
  })
  mergedCount!: number;

  @ApiProperty({
    description: 'IDs of the source mandalas that were merged',
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  sourceMandalaIds!: string[];
}
