import { Injectable, Logger } from '@nestjs/common';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import {
  AiValidationConfig,
  getAiValidationConfig,
} from '@config/ai-validation.config';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FileValidationError {
  fileName: string;
  mimeType: string;
  size: number;
  reason: string;
}

@Injectable()
export class AiRequestValidator {
  private readonly logger = new Logger(AiRequestValidator.name);
  private readonly config: AiValidationConfig;

  constructor() {
    this.config = getAiValidationConfig();
    this.logger.log('AI Request Validator initialized with config:', {
      maxFileSize: this.config.maxFileSize,
      maxInputSize: this.config.maxInputSize,
      maxPostitsPerRequest: this.config.maxPostitsPerRequest,
      allowedMimeTypesCount: this.config.allowedMimeTypes.length,
      blockedMimeTypesCount: this.config.blockedMimeTypes.length,
    });
  }

  /**
   * Main validation method - runs all checks before sending request to AI API
   */
  validateAiRequest(
    fileBuffers: FileBuffer[],
    projectId: string,
    dimensions: string[],
    scales: string[],
    expectedPostitsCount?: number,
  ): ValidationResult {
    this.logger.log(`Starting AI request validation for project ${projectId}`, {
      fileCount: fileBuffers.length,
      dimensionsCount: dimensions.length,
      scalesCount: scales.length,
      expectedPostitsCount,
    });

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file types and individual sizes
    const fileValidationResult = this.validateFiles(fileBuffers);
    if (!fileValidationResult.isValid) {
      errors.push(...fileValidationResult.errors);

      fileValidationResult.errors.forEach((error) => {
        this.logger.error(`File validation failed: ${error}`, {
          projectId,
          timestamp: new Date().toISOString(),
        });
      });
    }

    // Check total input size across all files
    const totalInputSize = fileBuffers.reduce(
      (sum, file) => sum + file.buffer.length,
      0,
    );
    if (totalInputSize > this.config.maxInputSize) {
      const error = `Total input size (${this.formatBytes(totalInputSize)}) exceeds maximum allowed (${this.formatBytes(this.config.maxInputSize)})`;
      errors.push(error);
      this.logger.error('Input size validation failed', {
        projectId,
        totalInputSize,
        maxInputSize: this.config.maxInputSize,
        exceedsBy: totalInputSize - this.config.maxInputSize,
        timestamp: new Date().toISOString(),
      });
    }

    // Check expected postits count if provided
    if (
      expectedPostitsCount &&
      expectedPostitsCount > this.config.maxPostitsPerRequest
    ) {
      const error = `Expected postits count (${expectedPostitsCount}) exceeds maximum allowed (${this.config.maxPostitsPerRequest})`;
      errors.push(error);
      this.logger.error('Postits count validation failed', {
        projectId,
        expectedPostitsCount,
        maxPostitsPerRequest: this.config.maxPostitsPerRequest,
        exceedsBy: expectedPostitsCount - this.config.maxPostitsPerRequest,
        timestamp: new Date().toISOString(),
      });
    }

    // Validate required parameters are not empty
    if (dimensions.length === 0) {
      errors.push('Dimensions array cannot be empty');
      this.logger.error('Dimensions validation failed: empty array', {
        projectId,
      });
    }

    if (scales.length === 0) {
      errors.push('Scales array cannot be empty');
      this.logger.error('Scales validation failed: empty array', { projectId });
    }

    if (fileBuffers.length === 0) {
      errors.push('No files provided for AI processing');
      this.logger.error('File count validation failed: no files', {
        projectId,
      });
    }

    const isValid = errors.length === 0;

    if (isValid) {
      this.logger.log(`AI request validation passed for project ${projectId}`, {
        fileCount: fileBuffers.length,
        totalInputSize: this.formatBytes(totalInputSize),
        dimensionsCount: dimensions.length,
        scalesCount: scales.length,
      });
    } else {
      this.logger.error(
        `AI request validation failed for project ${projectId}`,
        {
          errorCount: errors.length,
          errors,
          warnings,
          timestamp: new Date().toISOString(),
        },
      );
    }

    return {
      isValid,
      errors,
      warnings,
    };
  }

  /**
   * Validates each file individually for type, size and content
   */
  private validateFiles(fileBuffers: FileBuffer[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const invalidFiles: FileValidationError[] = [];

    fileBuffers.forEach((fileBuffer, index) => {
      const fileErrors = this.validateSingleFile(fileBuffer, index);
      if (fileErrors.length > 0) {
        invalidFiles.push({
          fileName: fileBuffer.fileName,
          mimeType: fileBuffer.mimeType,
          size: fileBuffer.buffer.length,
          reason: fileErrors.join(', '),
        });
        errors.push(...fileErrors);
      }
    });

    if (invalidFiles.length > 0) {
      this.logger.error('Invalid files detected', {
        invalidFileCount: invalidFiles.length,
        invalidFiles: invalidFiles.map((file) => ({
          fileName: file.fileName,
          mimeType: file.mimeType,
          size: this.formatBytes(file.size),
          reason: file.reason,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates a single file for type, size and basic properties
   */
  private validateSingleFile(fileBuffer: FileBuffer, index: number): string[] {
    const errors: string[] = [];
    const { fileName, mimeType, buffer } = fileBuffer;

    if (this.config.blockedMimeTypes.includes(mimeType)) {
      errors.push(`File '${fileName}' has blocked MIME type: ${mimeType}`);
    }

    if (
      !this.config.blockedMimeTypes.includes(mimeType) &&
      !this.config.allowedMimeTypes.includes(mimeType)
    ) {
      errors.push(`File '${fileName}' has unsupported MIME type: ${mimeType}`);
    }

    if (buffer.length > this.config.maxFileSize) {
      errors.push(
        `File '${fileName}' size (${this.formatBytes(buffer.length)}) exceeds maximum allowed (${this.formatBytes(this.config.maxFileSize)})`,
      );
    }

    if (buffer.length === 0) {
      errors.push(`File '${fileName}' is empty`);
    }

    if (!fileName || fileName.trim().length === 0) {
      errors.push(`File at index ${index} has no name`);
    }

    return errors;
  }

  /**
   * Converts bytes to human readable format (e.g., 1024 -> 1 KB)
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Returns current validation configuration
   */
  getConfig(): AiValidationConfig {
    return { ...this.config };
  }
}
