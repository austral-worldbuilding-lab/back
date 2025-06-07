import { DimensionDto } from '@common/dto/dimension.dto';

export interface MandalaConfiguration {
  dimensions: DimensionDto[];
  scales: string[];
}
