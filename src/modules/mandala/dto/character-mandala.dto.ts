import { ApiProperty } from '@nestjs/swagger';

export class CharacterMandalaDto {
  @ApiProperty({ description: 'ID único del mandala personaje' })
  id!: string;

  @ApiProperty({ description: 'Nombre del mandala personaje' })
  name!: string;

  @ApiProperty({ description: 'Color asociado al personaje' })
  color!: string;
}
