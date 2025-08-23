import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class OverlapMandalasDto {
  @ApiProperty({
    description:
      'Array of mandala IDs to overlap (minimum 2). All mandalas must have the same dimensions and scales. The new overlapped mandala will be saved in the project of the first mandala in the list.',
    type: [String],
    example: [
      'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
    ],
    minItems: 2,
  })
  @IsArray()
  @ArrayMinSize(2, {
    message: 'At least 2 mandala IDs are required for overlap',
  })
  @IsUUID(undefined, {
    each: true,
    message: 'Each mandala ID must be a valid UUID',
  })
  mandalas!: string[];
}
