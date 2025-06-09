import { DimensionDto } from '@common/dto/dimension.dto';
import { CreateMandalaCenterDto } from '@/modules/mandala/dto/create-mandala.dto';

export interface CreateMandalaConfiguration {
  center: CreateMandalaCenterDto;
  dimensions: DimensionDto[];
  scales: string[];
  linkedTo?: string | null; // mandalaId del personaje padre
}
