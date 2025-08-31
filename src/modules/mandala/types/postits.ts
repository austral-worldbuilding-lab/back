export interface PostitTag {
  name: string;
  color: string;
}

export interface AiPostitResponse {
  content: string;
  dimension: string;
  section: string;
  tags: string[];
  childrens: Postit[];
  imageFileName?: string;
}

export interface AiPostitComparisonResponse {
  content: string;
  dimension: string;
  section: string;
  tags: string[];
  type: string;
  from: string[];
}

export interface Postit {
  id: string;
  content: string;
  dimension: string;
  section: string;
  tags: PostitTag[];
  childrens: Postit[];
  imageFileName?: string;
}

export interface PostitComparison extends Postit {
  type: string;
  from: string[];
}

export interface PostitCoordinates {
  x: number; // percentile
  y: number; // percentile
}

export interface PostitWithCoordinates extends Postit {
  coordinates: PostitCoordinates;
  childrens: PostitWithCoordinates[];
  presignedUrl?: string;
}
