import { MandalaDto } from './mandala.dto';
import { PostitWithCoordinates } from '../types/postits';

export class MandalaWithPostitsAndLinkedCentersDto {
  mandala!: MandalaDto;
  postits!: PostitWithCoordinates[];
  linkedMandalasCenter!: LinkedMandalaCenterDto[];
}

export class LinkedMandalaCenterDto {
  name!: string;
  description?: string;
  color!: string;
  position!: { x: number; y: number };
  section!: string;
  dimension!: string;
}
