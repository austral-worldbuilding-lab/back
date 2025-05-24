import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { StorageService, FileBuffer } from './StorageService';
import { CreateFileDto } from '../files/dto/create-file.dto';
import { PresignedUrl } from '../common/types/presigned-url';

export class AzureBlobStorageService implements StorageService {
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
    projectId: string,
  ): Promise<PresignedUrl[]> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const urls: PresignedUrl[] = [];

    for (const file of files) {
      const blobName = `${projectId}/${file.file_name}`;
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

  async getFiles(projectId: string): Promise<CreateFileDto[]> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const descriptors: CreateFileDto[] = [];

    for await (const blob of containerClient.listBlobsFlat({
      prefix: `${projectId}/`,
    })) {
      descriptors.push({
        file_name: blob.name.split('/').pop() || '',
        file_type: blob.properties.contentType || 'unknown',
      });
    }

    return descriptors;
  }

  async readAllFilesAsBuffers(folder: string): Promise<Buffer[]> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const buffers: Buffer[] = [];

    for await (const blob of containerClient.listBlobsFlat({
      prefix: `${folder}/`,
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

  async readAllFilesAsBuffersWithMetadata(folder: string): Promise<FileBuffer[]> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const fileBuffers: FileBuffer[] = [];

    for await (const blob of containerClient.listBlobsFlat({
      prefix: `${folder}/`,
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
        fileName: blob.name.split('/').pop() || '',
        mimeType: blob.properties.contentType || 'application/octet-stream',
      });
    }

    return fileBuffers;
  }
}
