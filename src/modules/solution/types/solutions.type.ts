export interface AiSolutionResponse {
  title: string;
  description: string;
  problem: string;
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  impactDescription: string;
}
