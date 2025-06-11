import { ApiProperty, ApiTags } from '@nestjs/swagger';

@ApiTags('Frontend DTOs - Filters')
class FilterOptionDto {
  @ApiProperty({
    description: 'Etiqueta del filtro',
    example: 'Cultura',
  })
  label!: string;

  @ApiProperty({
    description: 'Color del filtro en formato hexadecimal',
    example: '#FF0000',
    required: false,
  })
  color?: string;
}

@ApiTags('Frontend DTOs - Filters')
export class FilterSectionDto {
  @ApiProperty({
    description: 'Nombre de la sección de filtros',
    example: 'Dimensiones',
  })
  sectionName!: string;

  @ApiProperty({
    description: 'Tipo de selección del filtro',
    example: 'multiple',
  })
  type!: 'multiple';

  @ApiProperty({
    description: 'Opciones disponibles para este filtro',
    type: [FilterOptionDto],
  })
  options!: FilterOptionDto[];
}
