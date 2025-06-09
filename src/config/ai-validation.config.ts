export interface AiValidationConfig {
  allowedMimeTypes: string[];
  blockedMimeTypes: string[];
  maxFileSize: number; // in bytes
  maxInputSize: number; // in bytes
  maxPostitsPerRequest: number;
}

/**
 * Returns AI validation configuration with environment variable overrides
 */
export const getAiValidationConfig = (): AiValidationConfig => ({
  allowedMimeTypes: [
    'text/plain',
    'text/csv',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/json',
    'text/markdown',
  ],

  blockedMimeTypes: [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/mkv',
    'video/m4v',
    'video/3gp',
    'video/quicktime',
    'audio/mp3',
    'audio/wav',
    'audio/flac',
    'audio/aac',
    'audio/ogg',
    'audio/wma',
  ],

  maxFileSize: parseInt(process.env.AI_MAX_FILE_SIZE || '52428800'), // 50MB default
  maxInputSize: parseInt(process.env.AI_MAX_INPUT_SIZE || '209715200'), // 200MB default
  maxPostitsPerRequest: parseInt(
    process.env.AI_MAX_POSTITS_PER_REQUEST || '100',
  ), // 100 default
});
