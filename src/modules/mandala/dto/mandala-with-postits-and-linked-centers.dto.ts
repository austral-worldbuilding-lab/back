import { MandalaDto } from './mandala.dto';
import { PostitWithCoordinates } from '../types/postits';
import { LinkedMandalaCenterDto } from './linked-mandala-center.dto';

export class MandalaWithPostitsAndLinkedCentersDto {
  mandala!: MandalaDto;
  postits!: PostitWithCoordinates[];
  linkedMandalasCenter!: LinkedMandalaCenterDto[];
}
