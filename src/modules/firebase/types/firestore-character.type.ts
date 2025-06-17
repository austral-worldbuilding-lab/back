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
  postits?: any[];
  characters?: FirestoreCharacter[];
}
