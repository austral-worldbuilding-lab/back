import { AiSolutionResponse } from '@modules/solution/types/solutions.type';

export interface SolutionsJobData {
  projectId: string;
  userId: string;
  organizationId?: string;
}

export interface SolutionsJobResult {
  solutions: AiSolutionResponse[];
}

export enum SolutionsJobStatus {
  NONE = 'none', // No job active for this project
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}

export interface SolutionsJobStatusResponse {
  jobId?: string; // Optional - won't exist when status is NONE
  status: SolutionsJobStatus;
  progress?: number;
  result?: SolutionsJobResult;
  error?: string;
  failedReason?: string;
  createdAt?: Date;
  processedAt?: Date;
  finishedAt?: Date;
}
