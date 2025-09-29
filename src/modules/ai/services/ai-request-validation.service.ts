import {
  AiValidationConfig,
  getAiValidationConfig,
} from '@config/ai-validation.config';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { Injectable, Logger } from '@nestjs/common';

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
export class AiRequestValidationService {
  private readonly logger = new Logger(AiRequestValidationService.name);
  private readonly config: AiValidationConfig;

  constructor() {
    this.config = getAiValidationConfig();
    this.logger.log('AI Request Validation Service initialized with config:', {
      maxFileSize: this.formatBytes(this.config.maxFileSize),
      maxInputSize: this.formatBytes(this.config.maxInputSize),
      maxResultsPerRequest: this.config.maxResultsPerRequest,
      allowedMimeTypesCount: this.config.allowedMimeTypes.length,
      blockedMimeTypesCount: this.config.blockedMimeTypes.length,
    });
  }

  validateResponseForAi(
    fileBuffers: FileBuffer[],
    results: number,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const fileValidationResult = this.validateFilesForAi(fileBuffers);
    if (!fileValidationResult.isValid) {
      errors.push(...fileValidationResult.errors);
      warnings.push(...fileValidationResult.warnings);
    }

    const totalInputSizeValidation = this.validateTotalInputSize(fileBuffers);
    if (!totalInputSizeValidation.isValid) {
      errors.push(...totalInputSizeValidation.errors);
    }

    const resultsValidation = this.validateResultsCount(results);
    if (!resultsValidation.isValid) {
      errors.push(...resultsValidation.errors);
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      this.logger.error('AI response validation failed', {
        errorCount: errors.length,
        warningCount: warnings.length,
        errors,
        warnings,
      });
    }

    return {
      isValid,
      errors,
      warnings,
    };
  }

  private validateFilesForAi(fileBuffers: FileBuffer[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const invalidFiles: FileValidationError[] = [];

    fileBuffers.forEach((fileBuffer, index) => {
      const fileErrors = this.validateSingleFileForAi(fileBuffer, index);
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
      this.logger.error('Invalid files detected for AI processing', {
        invalidFileCount: invalidFiles.length,
        invalidFiles: invalidFiles.map((file) => ({
          fileName: file.fileName,
          mimeType: file.mimeType,
          size: this.formatBytes(file.size),
          reason: file.reason,
        })),
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateSingleFileForAi(
    fileBuffer: FileBuffer,
    index: number,
  ): string[] {
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

  private validateTotalInputSize(fileBuffers: FileBuffer[]): ValidationResult {
    const totalInputSize = this.getTotalInputSize(fileBuffers);

    if (totalInputSize > this.config.maxInputSize) {
      const error = `Total input size (${this.formatBytes(totalInputSize)}) exceeds maximum allowed (${this.formatBytes(this.config.maxInputSize)})`;

      this.logger.error('Input size validation failed', {
        totalInputSize,
        maxInputSize: this.config.maxInputSize,
        exceedsBy: totalInputSize - this.config.maxInputSize,
      });

      return {
        isValid: false,
        errors: [error],
        warnings: [],
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  private validateResultsCount(results: number): ValidationResult {
    if (results > this.config.maxResultsPerRequest) {
      const error = `Expected results count (${results}) exceeds maximum allowed (${this.config.maxResultsPerRequest})`;

      this.logger.error('Results count validation failed', {
        expectedResults: results,
        maxResultsPerRequest: this.config.maxResultsPerRequest,
        exceedsBy: results - this.config.maxResultsPerRequest,
      });

      return {
        isValid: false,
        errors: [error],
        warnings: [],
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  private getTotalInputSize(fileBuffers: FileBuffer[]): number {
    return fileBuffers.reduce((sum, file) => sum + file.buffer.length, 0);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getConfig(): AiValidationConfig {
    return { ...this.config };
  }
}
