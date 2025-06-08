import { MandalaDto } from './mandala.dto';
import { PostitWithCoordinates } from '../types/postits';
import { CenterDto } from '@common/dto/center.dto';

export class MandalaWithPostitsAndLinkedCentersDto {
  mandala!: MandalaDto;
  postits!: PostitWithCoordinates[];
  linkedMandalasCenter!: CenterDto[];
}
