import { MandalaDto } from './mandala.dto';
import { PostitWithCoordinates } from '../types/postits';

export class MandalaWithPostitsAndLinkedCentersDto {
  mandala!: MandalaDto;
  postits!: PostitWithCoordinates[];
  childrenCenter!: ChildMandalaCenterDto[];
}

export class ChildMandalaCenterDto {
  name!: string;
  description?: string;
  color!: string;
  position!: { x: number; y: number };
  section!: string;
  dimension!: string;
}
