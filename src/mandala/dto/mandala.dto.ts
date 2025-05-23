import { ApiProperty } from '@nestjs/swagger';

export class MandalaDto {
  @ApiProperty({
    description: 'ID único del mandala'
  })
  id!: string;
  
  @ApiProperty({
    description: 'Nombre del mandala',
    example: 'Mandala del Sistema UA',
  })
  name!: string;
  
  @ApiProperty({
    description: 'ID del proyecto al que pertenece el mandala'
  })
  projectId!: string;
}
