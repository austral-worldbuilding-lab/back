export interface EncyclopediaJobData {
  projectId: string;
  selectedFiles?: string[];
}

export interface EncyclopediaJobResult {
  encyclopedia: string;
  storageUrl: string;
}

export enum EncyclopediaJobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}

export interface EncyclopediaJobStatusResponse {
  jobId: string;
  status: EncyclopediaJobStatus;
  progress?: number;
  result?: EncyclopediaJobResult;
  error?: string;
  failedReason?: string;
  createdAt?: Date;
  processedAt?: Date;
  finishedAt?: Date;
}
