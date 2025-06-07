import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMandalaDto {
  @ApiProperty({
    description: 'Nombre del mandala',
    example: 'Mandala del Sistema UA',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
