import { MandalaDto } from './mandala.dto';
import { PostitWithCoordinates } from '../types/postits';

export class MandalaWithPostitsDto {
  mandala!: MandalaDto;
  postits!: PostitWithCoordinates[];
}
