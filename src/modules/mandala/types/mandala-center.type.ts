import { CreateOverlappedMandalaCenterDto } from '../dto/create-mandala.dto';

export class MandalaCenter {
  id!: string;
  name!: string;
  description?: string;
  color!: string;
}

export class OverlappedMandalaCenter extends MandalaCenter {
  characters!: CreateOverlappedMandalaCenterDto[];
}
