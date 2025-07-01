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
  updatedAt?: Date;
}
