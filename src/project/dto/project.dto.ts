import { ApiProperty } from '@nestjs/swagger';

export class ProjectDto {
  @ApiProperty({
    description: 'ID único del proyecto'
  })
  id!: string;
  
  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Proyecto Comedor Austral'
  })
  name!: string;
}
