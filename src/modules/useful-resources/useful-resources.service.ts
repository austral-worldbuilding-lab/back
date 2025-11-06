import { BlobServiceClient } from '@azure/storage-blob';
import { AppLogger } from '@common/services/logger.service';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { Injectable } from '@nestjs/common';

import { UsefulResourceDto } from './dto/useful-resource.dto';

@Injectable()
export class UsefulResourcesService {
  private readonly usefulResourcesPath = 'useful-resources/';
  private readonly awblWebsiteUrl =
    'https://www.austral.edu.ar/comunicacion/austral-world-building-lab/';

  constructor(
    private readonly blobStorageService: AzureBlobStorageService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UsefulResourcesService.name);
  }

  async getAllResources(): Promise<UsefulResourceDto[]> {
    this.logger.debug('Fetching useful resources from blob storage');

    const resources: UsefulResourceDto[] = [];

    const blobFiles = await this.getBlobFiles();
    resources.push(...blobFiles);

    // Add AWBL website URL
    resources.push({
      file_name: 'AWBL Website',
      file_type: 'link',
      url: this.awblWebsiteUrl,
    });

    this.logger.debug(`Found ${resources.length} useful resources`, {
      blobFilesCount: blobFiles.length,
    });

    return resources;
  }

  private async getBlobFiles(): Promise<UsefulResourceDto[]> {
    const containerName = (this.blobStorageService as any)
      .containerName as string;
    const blobServiceClient = (this.blobStorageService as any)
      .blobServiceClient as BlobServiceClient;

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const prefix = this.usefulResourcesPath;

    const resources: UsefulResourceDto[] = [];

    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      const fileName = blob.name.replace(prefix, '');
      const contentType = blob.properties.contentType || 'unknown';

      const account = process.env.AZURE_STORAGE_ACCOUNT!;
      const publicUrl = `https://${account}.blob.core.windows.net/${containerName}/${blob.name}`;

      resources.push({
        file_name: fileName,
        file_type: contentType,
        url: publicUrl,
      });
    }

    return resources;
  }
}
