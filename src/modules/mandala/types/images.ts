import { Tag } from '@modules/mandala/types/postits';
import { CreateTagDto } from '@modules/project/dto/create-tag.dto';

export interface MandalaImage {
  id: string;
  url: string;
  coordinates: {
    x: number;
    y: number;
  };
  dimension: string;
  section: string;
  tags: Tag[];
}

export interface CreateMandalaImageRequest {
  projectId: string;
  mandalaId: string;
  fileName: string;
}

export interface ConfirmMandalaImageRequest {
  id: string;
  tags?: CreateTagDto[];
}
