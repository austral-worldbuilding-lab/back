export interface PostitTag {
  name: string;
  color: string;
}

export interface AiPostitResponse {
  content: string;
  dimension: string;
  section: string;
  tags: string[];
  fatherId: string | null;
}

export interface Postit {
  content: string;
  dimension: string;
  section: string;
  tags: PostitTag[];
  fatherId: string | null;
}

export interface PostitCoordinates {
  x: number; // percentile
  y: number; // percentile
}

export interface PostitWithCoordinates extends Postit {
  coordinates: PostitCoordinates;
}
