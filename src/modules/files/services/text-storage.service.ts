import { AppLogger } from '@common/services/logger.service';
import { FileScope } from '@modules/files/types/file-scope.type';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { StorageFolder } from '@modules/storage/path-builder';
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
    folderName: StorageFolder = 'files',
  ): Promise<string> {
    this.logger.debug(`Uploading text content as ${filename}`, {
      scope,
      folderName,
      contentLength: content.length,
    });

    const buffer = Buffer.from(content, 'utf-8');

    await this.blobStorageService.uploadBuffer(
      buffer,
      filename,
      scope,
      folderName,
      'text/plain',
    );

    const publicUrl = this.blobStorageService.buildPublicUrl(
      scope,
      filename,
      folderName,
    );

    this.logger.debug(`Successfully uploaded text content`, {
      filename,
      scope,
      folderName,
      publicUrl,
    });

    return publicUrl;
  }
}
