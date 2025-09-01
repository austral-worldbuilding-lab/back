import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import {
  ExternalServiceException,
  ResourceNotFoundException,
} from '@common/exceptions/custom-exceptions';
import { PresignedUrl } from '@common/types/presigned-url';
import { CreateFileDto } from '@modules/files/dto/create-file.dto';
import { FileBuffer } from '@modules/files/types/file-buffer.interface';
import { FileScope } from '@modules/files/types/file-scope.type';
import { Injectable, Logger } from '@nestjs/common';

import { buildPrefix } from './path-builder';
import { StorageService } from './StorageService';

@Injectable()
export class AzureBlobStorageService implements StorageService {
  private readonly logger = new Logger(AzureBlobStorageService.name);
  private containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;
  private blobServiceClient: BlobServiceClient;

  constructor() {
    const account = process.env.AZURE_STORAGE_ACCOUNT!;
    const accountKey = process.env.AZURE_STORAGE_ACCESS_KEY!;
    const sharedKeyCredential = new StorageSharedKeyCredential(
      account,
      accountKey,
    );
    this.blobServiceClient = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      sharedKeyCredential,
    );
  }

  async uploadFiles(
    files: CreateFileDto[],
    scope: FileScope,
  ): Promise<PresignedUrl[]> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const urls: PresignedUrl[] = [];
    const prefix = buildPrefix(scope);

    for (const file of files) {
      const blobName = `${prefix}${file.file_name}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const expiresOn = new Date(new Date().valueOf() + 3600 * 1000);
      const sasUrl = await blockBlobClient.generateSasUrl({
        permissions: BlobSASPermissions.parse('cw'),
        expiresOn,
      });
      urls.push({ url: sasUrl });
    }

    return urls;
  }

  async getFiles(scope: FileScope): Promise<CreateFileDto[]> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const descriptors: CreateFileDto[] = [];
    const prefix = buildPrefix(scope);

    for await (const blob of containerClient.listBlobsFlat({
      prefix: prefix,
    })) {
      descriptors.push({
        file_name: blob.name.replace(prefix, ''),
        file_type: blob.properties.contentType || 'unknown',
      });
    }

    return descriptors;
  }

  async readAllFilesAsBuffers(scope: FileScope): Promise<Buffer[]> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const buffers: Buffer[] = [];
    const prefix = buildPrefix(scope);

    for await (const blob of containerClient.listBlobsFlat({
      prefix: prefix,
    })) {
      const blobClient = containerClient.getBlobClient(blob.name);
      const downloadResponse = await blobClient.download();

      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody!) {
        chunks.push(Buffer.from(chunk));
      }

      const fullBuffer = Buffer.concat(chunks);
      buffers.push(fullBuffer);
    }

    return buffers;
  }

  async readAllFilesAsBuffersWithMetadata(
    scope: FileScope,
  ): Promise<FileBuffer[]> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const fileBuffers: FileBuffer[] = [];
    const prefix = buildPrefix(scope);

    for await (const blob of containerClient.listBlobsFlat({
      prefix: prefix,
    })) {
      const blobClient = containerClient.getBlobClient(blob.name);
      const downloadResponse = await blobClient.download();

      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody!) {
        chunks.push(Buffer.from(chunk));
      }

      const fullBuffer = Buffer.concat(chunks);
      fileBuffers.push({
        buffer: fullBuffer,
        fileName: blob.name.replace(prefix, ''),
        mimeType: blob.properties.contentType || 'application/octet-stream',
      });
    }

    return fileBuffers;
  }

  async deleteFile(scope: FileScope, fileName: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const prefix = buildPrefix(scope);

    const blobName = `${prefix}${fileName}`;
    const blobClient = containerClient.getBlobClient(blobName);

    try {
      await blobClient.delete();
    } catch (rawError: unknown) {
      this.handleAzureDeletionError(rawError, blobName);
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    scope: FileScope,
    contentType: string = 'application/octet-stream',
  ): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const prefix = buildPrefix(scope);
    const blobName = `${prefix}${fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });

    this.logger.debug(`Successfully uploaded ${fileName} to ${blobName}`);
  }

  async generateDownloadUrl(
    fullPath: string,
    expirationHours: number = 24,
  ): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const blockBlobClient = containerClient.getBlockBlobClient(fullPath);

    const expiresOn = new Date(
      new Date().valueOf() + expirationHours * 3600 * 1000,
    );

    return await blockBlobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse('r'), // read-only permission
      expiresOn,
    });
  }

  private handleAzureDeletionError(error: unknown, blobName: string): never {
    const isNativeError = error instanceof Error;
    const stack = isNativeError ? error.stack : undefined;

    const err = error as {
      statusCode?: number;
      details?: { errorCode?: string };
      message?: string;
    };

    const statusCode = err.statusCode;
    const message = err.details?.errorCode ?? err.message ?? 'Unknown error';

    if (statusCode === 404) {
      throw new ResourceNotFoundException('File', blobName, message);
    }

    this.logger.error(`Failed to delete blob ${blobName}: ${message}`, stack);

    throw new ExternalServiceException('AzureBlobStorage', message, err);
  }
}
