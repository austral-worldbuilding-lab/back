import { DimensionDto } from '@common/dto/dimension.dto';
import { CenterDto } from '@common/dto/center.dto';

export interface MandalaConfiguration {
  center: CenterDto;
  dimensions: DimensionDto[];
  scales: string[];
  linkedTo?: string; // mandalaId del personaje padre
}
