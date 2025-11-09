import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { URL } from 'url';

import { AppLogger } from '@common/services/logger.service';
import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';

import { AzureBlobStorageService } from '../../storage/AzureBlobStorageService';
import { FileScope } from '../types/file-scope.type';

@Injectable()
export class VideoProcessingService {
  constructor(
    private readonly storageService: AzureBlobStorageService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(VideoProcessingService.name);
  }

  async processVideoFile(fileUrl: string, fileName: string): Promise<string> {
    this.logger.log(`Starting video processing for: ${fileName}`);

    try {
      const scope = this.extractScopeFromUrl(fileUrl);
      const videoBuffer = await this.storageService.getFileBuffer(
        fileName,
        scope,
      );
      this.logger.debug(
        `Retrieved ${videoBuffer.length} bytes from blob storage`,
      );

      const audioBuffer = await this.convertVideoToAudio(videoBuffer, fileName);
      this.logger.debug(
        `Audio conversion completed, size: ${audioBuffer.length} bytes`,
      );

      const audioFileName = this.generateAudioFileName(fileName);
      await this.storageService.uploadBuffer(
        audioBuffer,
        audioFileName,
        scope,
        'files',
        'audio/mp3',
      );

      this.logger.log(
        `✅ Video processing completed: ${fileName} → ${audioFileName}`,
      );
      return audioFileName;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `❌ Video processing failed for ${fileName}: ${errorMessage}`,
        {
          error: errorStack,
          fileName,
          fileUrl,
        },
      );
      throw error;
    }
  }

  private async convertVideoToAudio(
    videoBuffer: Buffer,
    fileName: string,
  ): Promise<Buffer> {
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input_${Date.now()}_${fileName}`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.mp3`);

    try {
      await fs.writeFile(inputPath, videoBuffer);

      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .audioCodec('libmp3lame')
          .audioBitrate(128)
          .audioChannels(2)
          .audioFrequency(44100)
          .format('mp3')
          .on('start', (commandLine) => {
            this.logger.debug(`FFmpeg started: ${commandLine}`);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              this.logger.debug(
                `Processing: ${Math.round(progress.percent)}% done`,
              );
            }
          })
          .on('end', () => {
            (async () => {
              try {
                const audioBuffer = await fs.readFile(outputPath);
                await this.cleanupFiles([inputPath, outputPath]);
                this.logger.debug(`FFmpeg conversion completed successfully`);
                resolve(audioBuffer);
              } catch (readError) {
                const errorMsg =
                  readError instanceof Error
                    ? readError.message
                    : String(readError);
                this.logger.error('Failed to read output file', readError);
                await this.cleanupFiles([inputPath, outputPath]);
                reject(
                  new Error(`Failed to read converted audio: ${errorMsg}`),
                );
              }
            })().catch((error) => {
              this.logger.error(
                'Unexpected error in FFmpeg end handler',
                error,
              );
              reject(error instanceof Error ? error : new Error(String(error)));
            });
          })
          .on('error', (error) => {
            (async () => {
              this.logger.error('FFmpeg conversion failed', error);
              await this.cleanupFiles([inputPath, outputPath]);
              reject(new Error(`FFmpeg conversion failed: ${error.message}`));
            })().catch((cleanupError) => {
              this.logger.error(
                'Unexpected error in FFmpeg error handler',
                cleanupError,
              );
              reject(error instanceof Error ? error : new Error(String(error)));
            });
          })
          .save(outputPath);
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to write input file for FFmpeg', error);
      await this.cleanupFiles([inputPath, outputPath]);
      throw new Error(`Failed to prepare video for conversion: ${errorMsg}`);
    }
  }

  private async cleanupFiles(filePaths: string[]): Promise<void> {
    await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          // File might not exist, which is fine
          this.logger.warn(`Failed to cleanup file ${filePath}:`, error);
        }
      }),
    );
  }

  private generateAudioFileName(originalFileName: string): string {
    // Remove file extension and add -audio.mp3
    const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}-audio.mp3`;
  }

  private extractScopeFromUrl(fileUrl: string): FileScope {
    const path = new URL(fileUrl).pathname;
    const match = path.match(
      /\/org\/([^/]+)(?:\/project\/([^/]+))?(?:\/mandala\/([^/]+))?\/files\//,
    );

    if (!match) {
      throw new Error(`Invalid blob URL structure: ${fileUrl}`);
    }

    const [, orgId, projectId, mandalaId] = match;
    return {
      orgId,
      ...(projectId && { projectId }),
      ...(mandalaId && { mandalaId }),
    };
  }
}
