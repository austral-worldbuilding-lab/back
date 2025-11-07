export interface EncyclopediaJobData {
  projectId: string;
  selectedFiles?: string[];
}

export interface EncyclopediaJobResult {
  encyclopedia: string;
  html?: string;
  storageUrl: string;
  htmlStorageUrl?: string;
}

export enum EncyclopediaJobStatus {
  NONE = 'none', // No job active for this project
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}

export interface EncyclopediaJobStatusResponse {
  jobId?: string; // Optional - won't exist when status is NONE
  status: EncyclopediaJobStatus;
  progress?: number;
  result?: EncyclopediaJobResult;
  error?: string;
  failedReason?: string;
  createdAt?: Date;
  processedAt?: Date;
  finishedAt?: Date;
}
