export interface PostitSummary {
  content: string;
  dimension: string;
  section: string;
  childrenCount: number;
}

export interface DimensionSummary {
  name: string;
  postits: PostitSummary[];
  totalPostits: number;
}

export interface SectionSummary {
  name: string;
  postits: PostitSummary[];
  totalPostits: number;
}

export interface MandalaAiSummaryForQuestions {
  centerCharacter: {
    name: string;
    description: string;
  };
  dimensions: DimensionSummary[];
  sections: SectionSummary[];
  totalPostits: number;
}
