import { randomUUID } from 'crypto';

import { BusinessLogicException } from '@common/exceptions/custom-exceptions';
import { CreateFileDto } from '@modules/files/dto/create-file.dto';
import { FileScope } from '@modules/files/types/file-scope.type';
import { FirebaseDataService } from '@modules/firebase/firebase-data.service';
import { FirestoreMandalaDocument } from '@modules/firebase/types/firestore-character.type';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { Injectable } from '@nestjs/common';

import { MandalaRepository } from '../mandala.repository';
import {
  MandalaImage,
  CreateMandalaImageRequest,
  ConfirmMandalaImageRequest,
} from '../types/images';

@Injectable()
export class ImageService {
  constructor(
    private readonly mandalaRepository: MandalaRepository,
    private readonly firebaseDataService: FirebaseDataService,
    private readonly storageService: AzureBlobStorageService,
  ) {}

  async generatePresignedUrlForImage(
    imageUploadData: CreateMandalaImageRequest,
  ): Promise<{ imageId: string; presignedUrl: string }> {
    const mandalaInfo = await this.mandalaRepository.findMandalaWithProjectInfo(
      imageUploadData.mandalaId,
    );

    if (!mandalaInfo) {
      throw new BusinessLogicException(
        'Mandala not found or missing project information',
        {
          mandalaId: imageUploadData.mandalaId,
        },
      );
    }

    const imageId = randomUUID();
    const uniqueFileName = this.generateUniqueFileName(
      imageUploadData.fileName,
      imageId,
    );
    const fileScope = this.buildFileScope(
      mandalaInfo,
      imageUploadData.mandalaId,
    );

    const presignedUrl = await this.generatePresignedUrl(
      uniqueFileName,
      fileScope,
    );

    return { imageId: uniqueFileName, presignedUrl };
  }

  private generateUniqueFileName(
    originalFileName: string,
    imageId: string,
  ): string {
    const fileExtension = originalFileName.split('.').pop() || '';
    return `${imageId}.${fileExtension}`;
  }

  private buildFileScope(
    mandalaProjectInfo: { projectId: string; organizationId: string },
    mandalaId: string,
  ): FileScope {
    return {
      orgId: mandalaProjectInfo.organizationId,
      projectId: mandalaProjectInfo.projectId,
      mandalaId,
    };
  }

  private async generatePresignedUrl(
    fileName: string,
    storageScope: FileScope,
  ): Promise<string> {
    const fileMetadata: CreateFileDto = {
      file_name: fileName,
      file_type: 'image/*',
    };

    const presignedUrls = await this.storageService.uploadFiles(
      [fileMetadata],
      storageScope,
      'images',
    );

    const presignedUrl = presignedUrls[0]?.url;
    if (!presignedUrl) {
      throw new BusinessLogicException('Failed to generate presigned URL');
    }

    return presignedUrl;
  }

  async confirmImageUpload(
    projectId: string,
    mandalaId: string,
    imageData: ConfirmMandalaImageRequest,
  ): Promise<MandalaImage> {
    const mandalaDocument = await this.getMandalaDocument(projectId, mandalaId);

    const mandalaInfo =
      await this.mandalaRepository.findMandalaWithProjectInfo(mandalaId);
    if (!mandalaInfo) {
      throw new BusinessLogicException('Mandala not found', { mandalaId });
    }

    const fileName = imageData.id;
    const fileScope = this.buildFileScope(mandalaInfo, mandalaId);
    const publicUrl = this.storageService.buildPublicUrl(
      fileScope,
      fileName,
      'images',
    );

    const newImage: MandalaImage = {
      id: imageData.id,
      url: publicUrl,
      coordinates: {
        x: 0,
        y: 0,
      },
      dimension: '',
      section: '',
    };

    await this.addImageToMandala(
      projectId,
      mandalaId,
      mandalaDocument,
      newImage,
    );

    return newImage;
  }

  private async getMandalaDocument(
    projectId: string,
    mandalaId: string,
  ): Promise<FirestoreMandalaDocument> {
    const mandalaDocument = (await this.firebaseDataService.getDocument(
      projectId,
      mandalaId,
    )) as FirestoreMandalaDocument | null;

    if (!mandalaDocument) {
      throw new BusinessLogicException('Mandala not found', { mandalaId });
    }

    return mandalaDocument;
  }

  private async addImageToMandala(
    projectId: string,
    mandalaId: string,
    mandalaDocument: FirestoreMandalaDocument,
    newImage: MandalaImage,
  ): Promise<void> {
    const existingImages = mandalaDocument.images || [];
    const updatedImages = [...existingImages, newImage];

    await this.firebaseDataService.updateDocument(
      projectId,
      {
        images: updatedImages,
        updatedAt: new Date(),
      },
      mandalaId,
    );
  }

  async getImages(
    projectId: string,
    mandalaId: string,
  ): Promise<MandalaImage[]> {
    const mandalaDocument = await this.getMandalaDocument(projectId, mandalaId);
    return mandalaDocument.images || [];
  }

  async deleteImage(
    projectId: string,
    mandalaId: string,
    imageId: string,
  ): Promise<void> {
    const mandalaDocument = await this.getMandalaDocument(projectId, mandalaId);
    const existingImages = mandalaDocument.images || [];

    const imageToDelete = this.findImageById(existingImages, imageId);

    const updatedImages = this.removeImageFromList(existingImages, imageId);

    await this.updateMandalaImages(projectId, mandalaId, updatedImages);

    await this.deleteImageFromStorage(mandalaId, imageToDelete);
  }

  private findImageById(images: MandalaImage[], imageId: string): MandalaImage {
    const image = images.find((img) => img.id === imageId);
    if (!image) {
      throw new BusinessLogicException('Image not found', { imageId });
    }
    return image;
  }

  private removeImageFromList(
    images: MandalaImage[],
    imageId: string,
  ): MandalaImage[] {
    return images.filter((img) => img.id !== imageId);
  }

  private async updateMandalaImages(
    projectId: string,
    mandalaId: string,
    images: MandalaImage[],
  ): Promise<void> {
    await this.firebaseDataService.updateDocument(
      projectId,
      {
        images,
        updatedAt: new Date(),
      },
      mandalaId,
    );
  }

  private async deleteImageFromStorage(
    mandalaId: string,
    image: MandalaImage,
  ): Promise<void> {
    try {
      const mandalaProjectInfo =
        await this.mandalaRepository.findMandalaWithProjectInfo(mandalaId);

      if (!mandalaProjectInfo) {
        console.warn(
          `Could not get project info for mandala ${mandalaId}, skipping S3 deletion`,
        );
        return;
      }

      const storageScope = this.buildFileScope(mandalaProjectInfo, mandalaId);
      const fileName = this.extractFileNameFromUrl(image.url);

      await this.storageService.deleteFile(storageScope, fileName, 'images');
    } catch (error) {
      console.error(`Failed to delete image from S3: ${image.id}`, error);
    }
  }

  private extractFileNameFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }
}
