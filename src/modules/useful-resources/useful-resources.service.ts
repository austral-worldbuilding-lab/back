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
    const files = await this.blobStorageService.listBlobsByPrefix(
      this.usefulResourcesPath,
    );

    return files.map((file) => ({
      file_name: file.file_name,
      file_type: file.file_type,
      url: this.blobStorageService.buildPublicUrlForPath(
        `${this.usefulResourcesPath}${file.file_name}`,
      ),
    }));
  }
}
