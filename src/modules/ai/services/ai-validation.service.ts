import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AiValidationConfig,
  ValidationResult,
  FileValidationDetails,
} from '../interfaces/ai-validation.interface';

@Injectable()
export class AiValidationService {
  private readonly logger = new Logger(AiValidationService.name);
  private readonly config: AiValidationConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      allowedMimeTypes: this.getArrayFromConfig('AI_ALLOWED_MIME_TYPES', [
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ]),
      maxFileSize:
        this.configService.get<number>('AI_MAX_FILE_SIZE') || 10 * 1024 * 1024, // 10MB default
      maxPostits: this.configService.get<number>('AI_MAX_POSTITS') || 100, // 100 default
      maxTotalInputSize:
        this.configService.get<number>('AI_MAX_TOTAL_INPUT_SIZE') ||
        50 * 1024 * 1024, // 50MB default
    };

    this.logger.log('AI Validation Service initialized with config:', {
      allowedMimeTypesCount: this.config.allowedMimeTypes.length,
      maxFileSize: this.formatBytes(this.config.maxFileSize),
      maxPostits: this.config.maxPostits,
      maxTotalInputSize: this.formatBytes(this.config.maxTotalInputSize),
    });
  }

  validateBeforeAiRequest(
    fileBuffers: FileBuffer[],
    expectedPostits: number,
  ): ValidationResult {
    const errors: string[] = [];
    const fileValidations: FileValidationDetails[] = [];

    let totalSize = 0;
    for (const fileBuffer of fileBuffers) {
      const fileValidation = this.validateFile(fileBuffer);
      fileValidations.push(fileValidation);

      if (!fileValidation.isValid) {
        errors.push(
          `File ${fileValidation.fileName}: ${fileValidation.reason}`,
        );
        this.logger.warn('File validation failed', {
          fileName: fileValidation.fileName,
          mimeType: fileValidation.mimeType,
          size: this.formatBytes(fileValidation.size),
          reason: fileValidation.reason,
        });
      }

      totalSize += fileBuffer.buffer.length;
    }

    // Validate total input size
    if (totalSize > this.config.maxTotalInputSize) {
      const error = `Total input size (${this.formatBytes(totalSize)}) exceeds maximum allowed (${this.formatBytes(this.config.maxTotalInputSize)})`;
      errors.push(error);
      this.logger.warn('Total input size validation failed', {
        totalSize: this.formatBytes(totalSize),
        maxAllowed: this.formatBytes(this.config.maxTotalInputSize),
        fileCount: fileBuffers.length,
      });
    }

    // Validate expected postits count
    if (expectedPostits > this.config.maxPostits) {
      const error = `Expected postits count (${expectedPostits}) exceeds maximum allowed (${this.config.maxPostits})`;
      errors.push(error);
      this.logger.warn('Postits count validation failed', {
        expectedPostits,
        maxAllowed: this.config.maxPostits,
      });
    }

    const isValid = errors.length === 0;

    if (isValid) {
      this.logger.log('All validations passed', {
        filesCount: fileBuffers.length,
        totalSize: this.formatBytes(totalSize),
        expectedPostits,
      });
    } else {
      this.logger.error('Validation failed - AI request will be rejected', {
        errorsCount: errors.length,
        errors,
        filesCount: fileBuffers.length,
        totalSize: this.formatBytes(totalSize),
        expectedPostits,
      });
    }

    return {
      isValid,
      errors,
    };
  }

  private validateFile(fileBuffer: FileBuffer): FileValidationDetails {
    const { fileName, mimeType, buffer } = fileBuffer;
    const size = buffer.length;

    // Check if mime type is allowed
    if (!this.config.allowedMimeTypes.includes(mimeType)) {
      return {
        fileName,
        mimeType,
        size,
        isValid: false,
        reason: `File type '${mimeType}' is not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`,
      };
    }

    // Check file size
    if (size > this.config.maxFileSize) {
      return {
        fileName,
        mimeType,
        size,
        isValid: false,
        reason: `File size (${this.formatBytes(size)}) exceeds maximum allowed (${this.formatBytes(this.config.maxFileSize)})`,
      };
    }

    return {
      fileName,
      mimeType,
      size,
      isValid: true,
    };
  }

  private getArrayFromConfig(key: string, defaultValue: string[]): string[] {
    const value = this.configService.get<string>(key);
    if (!value) {
      return defaultValue;
    }
    return value.split(',').map((item) => item.trim());
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Gets current validation configuration
   * @returns Current AiValidationConfig
   */
  getConfig(): AiValidationConfig {
    return { ...this.config };
  }
}
