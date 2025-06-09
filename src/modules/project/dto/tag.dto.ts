import { ApiProperty } from '@nestjs/swagger';

export class TagDto {
  @ApiProperty({
    description: 'Nombre del tag',
    example: 'Comedor',
  })
  name!: string;

  @ApiProperty({
    description: 'Color del tag en formato hexadecimal',
    example: '#3B82F6',
  })
  color!: string;
}
