import { ApiProperty } from '@nestjs/swagger';

export class OrganizationDto {
  @ApiProperty({ description: 'ID de la organización' })
  id!: string;

  @ApiProperty({ description: 'Nombre de la organización' })
  name!: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;
}
