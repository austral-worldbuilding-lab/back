export interface AiValidationConfig {
  allowedMimeTypes: string[];
  maxFileSize: number; // in bytes
  maxPostits: number;
  maxTotalInputSize: number; // in bytes
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FileValidationDetails {
  fileName: string;
  mimeType: string;
  size: number;
  isValid: boolean;
  reason?: string;
}
