import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { Injectable, Logger } from '@nestjs/common';

import { ValidationResult } from './ai-request-validation.service';

@Injectable()
export class FileValidationService {
  private readonly logger = new Logger(FileValidationService.name);

  validateFiles(fileBuffers: FileBuffer[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const existenceValidation = this.validateFileExistence(fileBuffers);
    if (!existenceValidation.isValid) {
      errors.push(...existenceValidation.errors);
    }

    const nonVideoFiles = this.excludeVideos(fileBuffers);
    if (nonVideoFiles.length !== fileBuffers.length) {
      const excludedCount = fileBuffers.length - nonVideoFiles.length;
      warnings.push(`Excluded ${excludedCount} video file(s) from processing`);
    }

    const fileValidation = this.validateIndividualFiles(nonVideoFiles);
    if (!fileValidation.isValid) {
      errors.push(...fileValidation.errors);
    }
    warnings.push(...fileValidation.warnings);

    const isValid = errors.length === 0;

    if (!isValid) {
      this.logger.error('File validation failed', {
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

  validateFileExistence(fileBuffers: FileBuffer[]): ValidationResult {
    const errors: string[] = [];

    if (fileBuffers.length === 0) {
      errors.push('No files provided for processing');
      return {
        isValid: false,
        errors,
        warnings: [],
      };
    }

    fileBuffers.forEach((fileBuffer, index) => {
      const basicValidation = this.validateBasicFileProperties(
        fileBuffer,
        index,
      );
      errors.push(...basicValidation.errors);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  excludeVideos(fileBuffers: FileBuffer[]): FileBuffer[] {
    return fileBuffers.filter((file) => !file.mimeType.startsWith('video/'));
  }

  private validateIndividualFiles(fileBuffers: FileBuffer[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    fileBuffers.forEach((fileBuffer, index) => {
      const { fileName, mimeType } = fileBuffer;

      const basicValidation = this.validateBasicFileProperties(
        fileBuffer,
        index,
      );
      errors.push(...basicValidation.errors);

      if (!mimeType || mimeType.trim().length === 0) {
        errors.push(`File '${fileName}' has no MIME type`);
      }

      if (fileName && fileName.includes('..')) {
        warnings.push(`File '${fileName}' contains path traversal characters`);
      }

      if (mimeType && mimeType.includes('application/octet-stream')) {
        warnings.push(`File '${fileName}' has generic binary MIME type`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateBasicFileProperties(
    fileBuffer: FileBuffer,
    index: number,
  ): ValidationResult {
    const errors: string[] = [];
    const { fileName, buffer } = fileBuffer;

    if (!fileName || fileName.trim().length === 0) {
      errors.push(`File at index ${index} has no name`);
    }

    if (buffer.length === 0) {
      const displayName = fileName || `at index ${index}`;
      errors.push(`File '${displayName}' is empty`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}
