import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';

import { Tag } from '@/modules/mandala/types/postits';

export class TagResponseDto {
  @ApiProperty({
    description: 'Nombre del tag',
    example: 'Importante',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Color del tag en formato hexadecimal',
    example: '#FF0000',
  })
  @IsHexColor()
  @IsNotEmpty()
  color!: string;
}

export function toTagResponseDto(tag: Tag): TagResponseDto {
  return {
    name: tag.name,
    color: tag.color,
  };
}
