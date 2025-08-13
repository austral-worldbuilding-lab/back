export interface PostitSummary {
  content: string;
  dimension: string;
  scale: string;
  childrenCount: number;
}

export interface DimensionSummary {
  name: string;
  postits: PostitSummary[];
  totalPostits: number;
}

export interface ScaleSummary {
  name: string;
  postits: PostitSummary[];
  totalPostits: number;
}

export interface MandalaAiSummary {
  centerCharacter: {
    name: string;
    description: string;
  };
  dimensions: DimensionSummary[];
  scales: ScaleSummary[];
  totalPostits: number;
}
