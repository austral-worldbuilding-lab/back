// src/modules/mandala/types/ai-report.ts

export type AiMandalaReport = {
  summary: string; // párrafo narrativo
  coincidences: string[];
  tensions: string[];
  insights: string[];
};

export const emptyReport = (): AiMandalaReport => ({
  summary: '',
  coincidences: [],
  tensions: [],
  insights: [],
});
