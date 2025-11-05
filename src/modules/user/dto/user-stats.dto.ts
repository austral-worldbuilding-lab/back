import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UserStatsDto {
  @ApiProperty({
    description: 'Cantidad de organizaciones (creadas e invitadas) del usuario',
    example: 5,
  })
  @IsNumber()
  organizationsCount!: number;

  @ApiProperty({
    description:
      'Cantidad de mundos/proyectos creados (incluye subproyectos y proyectos de provocaciones)',
    example: 12,
  })
  @IsNumber()
  projectsCount!: number;

  @ApiProperty({
    description: 'Cantidad total de mandalas',
    example: 45,
  })
  @IsNumber()
  mandalasCount!: number;

  @ApiProperty({
    description: 'Cantidad de soluciones generadas',
    example: 8,
  })
  @IsNumber()
  solutionsCount!: number;
}

