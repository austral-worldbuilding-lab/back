import { Tag } from '@modules/mandala/types/postits';

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
  tags?: Partial<Tag>[];
}
