import { FileBuffer } from '@modules/files/types/file-buffer.interface';

import { AiRequestValidator } from './ai-request.validator';

describe('AiRequestValidator', () => {
  let validator: AiRequestValidator;

  beforeEach(() => {
    validator = new AiRequestValidator();
  });

  describe('validateAiRequest', () => {
    it('should pass validation with valid inputs', () => {
      const fileBuffers: FileBuffer[] = [
        {
          buffer: Buffer.from('test content'),
          fileName: 'test.txt',
          mimeType: 'text/plain',
        },
      ];

      const result = validator.validateAiRequest(
        fileBuffers,
        'project-123',
        ['dimension1'],
        ['scale1'],
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation with blocked file type', () => {
      const fileBuffers: FileBuffer[] = [
        {
          buffer: Buffer.from('video content'),
          fileName: 'test.mp4',
          mimeType: 'video/mp4',
        },
      ];

      const result = validator.validateAiRequest(
        fileBuffers,
        'project-123',
        ['dimension1'],
        ['scale1'],
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "File 'test.mp4' has blocked MIME type: video/mp4",
      );
    });

    it('should fail validation with empty dimensions', () => {
      const fileBuffers: FileBuffer[] = [
        {
          buffer: Buffer.from('test content'),
          fileName: 'test.txt',
          mimeType: 'text/plain',
        },
      ];

      const result = validator.validateAiRequest(
        fileBuffers,
        'project-123',
        [], // empty dimensions
        ['scale1'],
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dimensions array cannot be empty');
    });

    it('should fail validation with file too large', () => {
      const config = validator.getConfig();
      const largeBuffer = Buffer.alloc(config.maxFileSize + 1);

      const fileBuffers: FileBuffer[] = [
        {
          buffer: largeBuffer,
          fileName: 'large.txt',
          mimeType: 'text/plain',
        },
      ];

      const result = validator.validateAiRequest(
        fileBuffers,
        'project-123',
        ['dimension1'],
        ['scale1'],
      );

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('exceeds maximum allowed'),
        ),
      ).toBe(true);
    });

    it('should fail validation with too many expected postits', () => {
      const fileBuffers: FileBuffer[] = [
        {
          buffer: Buffer.from('test content'),
          fileName: 'test.txt',
          mimeType: 'text/plain',
        },
      ];

      const config = validator.getConfig();
      const result = validator.validateAiRequest(
        fileBuffers,
        'project-123',
        ['dimension1'],
        ['scale1'],
        config.maxPostitsPerRequest + 1,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Expected postits count (${config.maxPostitsPerRequest + 1}) exceeds maximum allowed (${config.maxPostitsPerRequest})`,
      );
    });
  });
});
