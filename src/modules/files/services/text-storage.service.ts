import { AppLogger } from '@common/services/logger.service';
import { FileScope } from '@modules/files/types/file-scope.type';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TextStorageService {
  constructor(
    private readonly blobStorageService: AzureBlobStorageService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TextStorageService.name);
  }

  async uploadText(
    content: string,
    filename: string,
    scope: FileScope,
  ): Promise<string> {
    this.logger.debug(`Uploading text content as ${filename}`, {
      scope,
      contentLength: content.length,
    });

    const buffer = Buffer.from(content, 'utf-8');

    await this.blobStorageService.uploadBuffer(
      buffer,
      filename,
      scope,
      'text/plain',
    );

    const publicUrl = this.blobStorageService.buildPublicUrl(
      scope,
      filename,
      'files',
    );

    this.logger.debug(`Successfully uploaded text content`, {
      filename,
      scope,
      publicUrl,
    });

    return publicUrl;
  }
}
