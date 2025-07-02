import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CharacterListItemDto {
  @ApiProperty({
    description: 'Unique ID of the character (which is another mandala)',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Name of the character',
    example: 'Mandala of the University System',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Color associated with the character',
    example: '#3B82F6',
  })
  @IsHexColor()
  @IsNotEmpty()
  color!: string;
}
