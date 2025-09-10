export interface PostitWithCount {
  content: string;
  dimension: string;
  scale: string;
  childrenCount: number;
}

export interface DimensionWithCount {
  name: string;
  postits: PostitWithCount[];
  totalPostits: number;
}

export interface ScaleWithCount {
  name: string;
  postits: PostitWithCount[];
  totalPostits: number;
}

export interface CleanMandalaForQuestions {
  centerCharacter: {
    name: string;
    description: string;
  };
  dimensions: DimensionWithCount[];
  scales: ScaleWithCount[];
  totalPostits: number;
}

export interface PostitClean {
  content: string;
  dimension: string;
  scale: string;
}

export interface DimensionClean {
  name: string;
  postits: PostitClean[];
}

export interface ScaleClean {
  name: string;
  postits: PostitClean[];
}

export interface CleanMandalaForSummary {
  centerCharacter: {
    name: string;
    description: string;
  };
  dimensions: DimensionClean[];
  scales: ScaleClean[];
}
