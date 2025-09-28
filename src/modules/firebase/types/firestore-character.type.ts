import { MandalaImage } from '@modules/mandala/types/images';
import { PostitWithCoordinates } from '@modules/mandala/types/postits';

export interface FirestorePosition {
  x: number;
  y: number;
}

export interface FirestoreCharacter {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: FirestorePosition;
  section: string;
  dimension: string;
}

export interface FirestoreMandalaDocument {
  mandala?: any;
  postits?: PostitWithCoordinates[];
  characters?: FirestoreCharacter[];
  images?: MandalaImage[];
  updatedAt?: Date;
  summaryReport?: string;
}

export interface FirestoreMandala {
  id: string;
  name: string;
  type: string;
  projectId: string;

  configuration: {
    dimensions: { name: string; color?: string }[];
    scales: string[];
    center: {
      name: string;
      description?: string;
      color?: string;
      characters?: any[];
    };
  };

  parentIds?: string[];
  childrenIds?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  characters?: any[];
}
