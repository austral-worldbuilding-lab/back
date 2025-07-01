import { DimensionDto } from '@common/dto/dimension.dto';

export interface ProjectConfiguration {
  dimensions: DimensionDto[];
  scales: string[];
}
