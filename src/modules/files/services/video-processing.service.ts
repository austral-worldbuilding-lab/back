import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';
import { Readable } from 'stream';
import { URL } from 'url';

import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';

import { AzureBlobStorageService } from '../../storage/AzureBlobStorageService';
import { FileScope } from '../types/file-scope.type';

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);
  private readonly storageService: AzureBlobStorageService;

  constructor() {
    this.storageService = new AzureBlobStorageService();
  }

  async processVideoFile(fileUrl: string, fileName: string): Promise<string> {
    this.logger.log(`Starting video processing for: ${fileName}`);

    try {
      const videoBuffer = await this.downloadFileFromUrl(fileUrl);
      this.logger.debug(`Downloaded ${videoBuffer.length} bytes`);

      const audioBuffer = await this.convertVideoToAudio(videoBuffer, fileName);
      this.logger.debug(
        `Audio conversion completed, size: ${audioBuffer.length} bytes`,
      );

      const audioFileName = this.generateAudioFileName(fileName);
      const scope = this.extractScopeFromUrl(fileUrl);

      await this.storageService.uploadBuffer(
        audioBuffer,
        audioFileName,
        scope,
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

  private async downloadFileFromUrl(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const request = client.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download file: HTTP ${response.statusCode}`),
          );
          return;
        }

        const chunks: Buffer[] = [];

        response.on('data', (chunk) => {
          chunks.push(Buffer.from(chunk));
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });

        response.on('error', (error) => {
          reject(new Error(`Download error: ${error.message}`));
        });
      });

      request.on('error', (error) => {
        reject(new Error(`Request error: ${error.message}`));
      });

      request.setTimeout(300000); // 5 minute timeout for large files
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  private async convertVideoToAudio(
    videoBuffer: Buffer,
    fileName: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `input_${Date.now()}_${fileName}`);
      const outputPath = path.join(tempDir, `output_${Date.now()}.mp3`);

      try {
        fs.writeFileSync(inputPath, videoBuffer);

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
            try {
              const audioBuffer = fs.readFileSync(outputPath);

              fs.unlinkSync(inputPath);
              fs.unlinkSync(outputPath);

              this.logger.debug(`FFmpeg conversion completed successfully`);
              resolve(audioBuffer);
            } catch (readError) {
              this.logger.error('Failed to read output file', readError);
              this.cleanupFiles([inputPath, outputPath]);
              reject(new Error(`Failed to read converted audio: ${readError}`));
            }
          })
          .on('error', (error) => {
            this.logger.error('FFmpeg conversion failed', error);
            this.cleanupFiles([inputPath, outputPath]);
            reject(new Error(`FFmpeg conversion failed: ${error.message}`));
          })
          .save(outputPath);
      } catch (error) {
        this.logger.error('Failed to write input file for FFmpeg', error);
        this.cleanupFiles([inputPath, outputPath]);
        reject(new Error(`Failed to prepare video for conversion: ${error}`));
      }
    });
  }

  private cleanupFiles(filePaths: string[]): void {
    filePaths.forEach((filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        this.logger.warn(`Failed to cleanup file ${filePath}:`, error);
      }
    });
  }

  private generateAudioFileName(originalFileName: string): string {
    // Remove file extension and add -audio.mp3
    const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}-audio.mp3`;
  }

  private extractScopeFromUrl(fileUrl: string): FileScope {
    const path = new URL(fileUrl).pathname;
    const match = path.match(/\/org\/([^/]+)(?:\/project\/([^/]+))?(?:\/mandala\/([^/]+))?\/files\//);
    
    if (!match) {
      throw new Error(`Invalid blob URL structure: ${fileUrl}`);
    }

    const [, orgId, projectId, mandalaId] = match;
    return { orgId, ...(projectId && { projectId }), ...(mandalaId && { mandalaId }) };
  }
}
