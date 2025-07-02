import { DimensionDto } from '@common/dto/dimension.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

export class ProjectConfiguration {
  @ApiProperty({
    description: 'Dimensiones del proyecto',
    type: [DimensionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DimensionDto)
  dimensions!: DimensionDto[];

  @ApiProperty({
    description: 'Escalas del proyecto',
    type: [String],
    example: ['Persona', 'Comunidad', 'Institución'],
  })
  @IsArray()
  @IsString({ each: true })
  scales!: string[];
}
