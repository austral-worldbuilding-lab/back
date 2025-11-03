export interface AiValidationConfig {
  allowedMimeTypes: string[];
  blockedMimeTypes: string[];
  maxFileSize: number; // in bytes
  maxInputSize: number; // in bytes
  maxResultsPerRequest: number;
  minResultsPerRequest: number;
  minPostitsPerRequest: number;
  maxPostitsPerRequest: number;
  minQuestionsPerRequest: number;
  maxQuestionsPerRequest: number;
  minProvocationsPerRequest: number;
  maxProvocationsPerRequest: number;
  minSolutionsPerRequest: number;
  maxSolutionsPerRequest: number;
  minActionItemsPerRequest: number;
  maxActionItemsPerRequest: number;
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
    // Audio formats supported by Gemini
    'audio/aac',
    'audio/aiff',
    'audio/flac',
    'audio/m4a',
    'audio/mp3',
    'audio/mp4',
    'audio/mpeg',
    'audio/mpga',
    'audio/ogg',
    'audio/pcm',
    'audio/wav',
    'audio/webm',
    'audio/x-aac',
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
  ],

  maxFileSize: parseInt(process.env.AI_MAX_FILE_SIZE || '52428800'), // 50MB default
  maxInputSize: parseInt(process.env.AI_MAX_INPUT_SIZE || '209715200'), // 200MB default
  maxResultsPerRequest: parseInt(
    process.env.AI_MAX_RESULTS_PER_REQUEST || '24',
  ),
  minResultsPerRequest: parseInt(process.env.AI_MIN_RESULTS_PER_REQUEST || '6'),
  minPostitsPerRequest: parseInt(
    process.env.AI_MIN_POSTITS_PER_REQUEST ||
      process.env.AI_MIN_RESULTS_PER_REQUEST ||
      '6',
  ),
  maxPostitsPerRequest: parseInt(
    process.env.AI_MAX_POSTITS_PER_REQUEST ||
      process.env.AI_MAX_RESULTS_PER_REQUEST ||
      '24',
  ),
  minQuestionsPerRequest: parseInt(
    process.env.AI_MIN_QUESTIONS_PER_REQUEST ||
      process.env.AI_MIN_RESULTS_PER_REQUEST ||
      '6',
  ),
  maxQuestionsPerRequest: parseInt(
    process.env.AI_MAX_QUESTIONS_PER_REQUEST ||
      process.env.AI_MAX_RESULTS_PER_REQUEST ||
      '24',
  ),
  minProvocationsPerRequest: parseInt(
    process.env.AI_MIN_PROVOCATIONS_PER_REQUEST || '3',
  ),
  maxProvocationsPerRequest: parseInt(
    process.env.AI_MAX_PROVOCATIONS_PER_REQUEST || '5',
  ),
  minSolutionsPerRequest: parseInt(
    process.env.AI_MIN_SOLUTIONS_PER_REQUEST || '3',
  ),
  maxSolutionsPerRequest: parseInt(
    process.env.AI_MAX_SOLUTIONS_PER_REQUEST || '6',
  ),
  minActionItemsPerRequest: parseInt(
    process.env.AI_MIN_ACTION_ITEMS_PER_REQUEST || '1',
  ),
  maxActionItemsPerRequest: parseInt(
    process.env.AI_MAX_ACTION_ITEMS_PER_REQUEST || '9',
  ),
});
