import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';

import { CreateMandalaCenterDto } from './create-mandala.dto';

export class OverlapMandalaCenterDto {
  @ApiProperty({
    description:
      'Lista de todos los personajes centrales originales de las mandalas superpuestas',
    type: [CreateMandalaCenterDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one center character is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateMandalaCenterDto)
  centers!: CreateMandalaCenterDto[];
}
