import { AppLogger } from '@common/services/logger.service';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { Injectable } from '@nestjs/common';

import { UsefulResourceDto } from './dto/useful-resource.dto';

@Injectable()
export class UsefulResourcesService {
  private readonly usefulResourcesPath = 'useful-resources/';
  private readonly linksFileName = 'links.json';

  constructor(
    private readonly blobStorageService: AzureBlobStorageService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UsefulResourcesService.name);
  }

  async getAllResources(): Promise<UsefulResourceDto[]> {
    this.logger.debug('Fetching useful resources from blob storage');

    const resources: UsefulResourceDto[] = [];

    // Get files (excluding links.json)
    const blobFiles = await this.getBlobFiles();
    resources.push(...blobFiles);

    // Get links from links.json
    const links = await this.getLinks();
    resources.push(...links);

    this.logger.debug(`Found ${resources.length} useful resources`, {
      blobFilesCount: blobFiles.length,
      linksCount: links.length,
    });

    return resources;
  }

  private async getBlobFiles(): Promise<UsefulResourceDto[]> {
    const files = await this.blobStorageService.listBlobsByPrefix(
      this.usefulResourcesPath,
    );

    // Filter out the links.json file
    return files
      .filter((file) => file.file_name !== this.linksFileName)
      .map((file) => ({
        file_name: file.file_name,
        file_type: file.file_type,
        url: this.blobStorageService.buildPublicUrlForPath(
          `${this.usefulResourcesPath}${file.file_name}`,
        ),
      }));
  }

  private async getLinks(): Promise<UsefulResourceDto[]> {
    try {
      const linksPath = `${this.usefulResourcesPath}${this.linksFileName}`;

      // Download the links.json file
      const buffer =
        await this.blobStorageService.getBlobContentByPath(linksPath);
      const jsonContent = buffer.toString('utf-8');

      // Parse and validate
      const links = JSON.parse(jsonContent) as UsefulResourceDto[];

      this.logger.debug(
        `Loaded ${links.length} links from ${this.linksFileName}`,
      );

      return links;
    } catch (error) {
      // If links.json doesn't exist or fails to parse, log and return empty array
      this.logger.warn('Failed to load links.json, returning empty links', {
        error,
      });
      return [];
    }
  }
}
