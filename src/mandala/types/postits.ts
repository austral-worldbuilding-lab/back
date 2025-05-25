export interface Postit {
  content: string;
  dimension: string;
  section: string;
}

export interface PostitCoordinates {
  x: number; // percentile
  y: number; // percentile
  angle: number; // radians
  percentileDistance: number; // between 0 and 1, distance from the center to exterior
}

export interface PostitWithCoordinates extends Postit {
  coordinates: PostitCoordinates;
}
