import { AppLogger } from '@common/services/logger.service';
import { GoogleGenAI } from '@google/genai';
import { AiService } from '@modules/ai/ai.service';
import { SolutionImageResponse } from '@modules/ai/strategies/solution-images.strategy';
import { FileScope } from '@modules/files/types/file-scope.type';
import { ProjectService } from '@modules/project/project.service';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AzureBlobStorageService } from '../storage/AzureBlobStorageService';
import { buildPrefix, StorageFolder } from '../storage/path-builder';

import { SolutionService } from './solution.service';

@Injectable()
export class SolutionImageService {
  private ai: GoogleGenAI;
  private readonly geminiImageModel: string;

  constructor(
    private readonly aiService: AiService,
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService,
    private readonly solutionService: SolutionService,
    private readonly storageService: AzureBlobStorageService,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SolutionImageService.name);
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured in environment variables',
      );
    }
    this.ai = new GoogleGenAI({ apiKey });
    const imageModel = this.configService.get<string>('GEMINI_IMAGE_MODEL');
    if (!imageModel) {
      throw new Error(
        'GEMINI_IMAGE_MODEL is not configured in environment variables',
      );
    }
    this.geminiImageModel = imageModel;
  }

  /**
   * Generates and saves images for a solution
   * @param projectId - The project ID
   * @param solutionId - The solution ID
   * @param userId - Optional user ID for tracking
   * @param organizationId - Optional organization ID for tracking
   * @returns Array of public URLs for the generated images
   */
  async generateAndSaveSolutionImages(
    projectId: string,
    solutionId: string,
    userId?: string,
    organizationId?: string,
  ): Promise<string[]> {
    this.logger.log('Starting solution images generation and save', {
      projectId,
      solutionId,
    });

    // Get project and solution information
    const project = await this.projectService.findOne(projectId);
    const solution = await this.solutionService.findOne(solutionId);

    if (!solution) {
      throw new NotFoundException(`Solution with ID ${solutionId} not found`);
    }

    // Generate image prompts using AI service
    const imagePrompts = await this.aiService.generateSolutionImages(
      projectId,
      project.name,
      project.description || '',
      solutionId,
      solution.title,
      solution.description,
      userId,
      organizationId,
    );

    this.logger.log(`Generated ${imagePrompts.length} image prompts`, {
      projectId,
      solutionId,
    });

    // Generate actual images for each prompt
    const imageUrls: string[] = [];
    const fileScope: FileScope = {
      orgId: project.organizationId,
      projectId,
    };

    for (let i = 0; i < imagePrompts.length; i++) {
      const imagePrompt = imagePrompts[i];
      try {
        const fileName = this.generateFileName(solutionId, imagePrompt);
        await this.saveImageToStorage(imagePrompt, fileName, fileScope);
        const publicUrl = this.storageService.buildPublicUrl(
          fileScope,
          fileName,
          'deliverables',
        );
        imageUrls.push(publicUrl);
        this.logger.log(`Saved image ${i + 1}/${imagePrompts.length}`, {
          fileName,
          publicUrl,
        });
      } catch (error) {
        this.logger.error(
          `Failed to generate/save image ${i + 1} for solution ${solutionId}`,
          error,
        );
        // Continue with other images even if one fails
      }
    }

    this.logger.log('Solution images generation completed', {
      projectId,
      solutionId,
      imagesGenerated: imageUrls.length,
    });

    return imageUrls;
  }

  /**
   * Saves an image buffer to Azure blob storage in the deliverables folder
   */
  private async saveImageToStorage(
    imageData: { id: string; imageData: string },
    fileName: string,
    fileScope: FileScope,
  ): Promise<void> {
    // Convert base64 to buffer
    const base64Data = imageData.imageData.replace(
      /^data:image\/\w+;base64,/,
      '',
    );
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Upload to deliverables folder using the service method
    await this.storageService.uploadImageToDeliverables(
      imageBuffer,
      fileName,
      fileScope,
    );
  }

  /**
   * Generates a deterministic file name for a solution image
   */
  private generateFileName(
    solutionId: string,
    imagePrompt: SolutionImageResponse,
  ): string {
    // Create a deterministic name: solution-{solutionId}-{imageId}.png
    return `solution-${solutionId}-${imagePrompt.id}.png`;
  }

  async listSolutionImageUrls(
    projectId: string,
    solutionId: string,
    options?: {
      folder?: StorageFolder;
      sasHours?: number;
      usePublicUrl?: boolean;
    },
  ): Promise<string[]> {
    const folder = options?.folder ?? 'deliverables';
    const sasHours = options?.sasHours ?? 24;
    const usePublicUrl = options?.usePublicUrl ?? false;

    this.logger.log('Listing solution images', {
      projectId,
      solutionId,
      folder,
      sasHours,
      usePublicUrl,
    });

    const project = await this.projectService.findOne(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    // Scope para path builder
    const scope: FileScope = { orgId: project.organizationId, projectId };

    // Prefijo base de la carpeta (ej: org/{orgId}/projects/{projectId}/deliverables/)
    const basePrefix = buildPrefix(scope, folder);

    // Filtramos solo las imágenes de esa solución: solution-{solutionId}-*.png
    const solutionPrefix = `${basePrefix}solution-${solutionId}-image-`;

    // Listado de blobs bajo ese prefijo
    const blobs = await this.storageService.listBlobsByPrefix(solutionPrefix);

    // Construimos URLs (públicas o SAS):
    const urls: string[] = [];
    for (const b of blobs) {
      const fullPath = `${solutionPrefix}${b.file_name}`; // file_name ya viene sin el prefijo

      if (usePublicUrl) {
        urls.push(this.storageService.buildPublicUrlForPath(fullPath));
      } else {
        const sas = await this.storageService.generateDownloadUrl(
          fullPath,
          sasHours,
        );
        urls.push(sas);
      }
    }

    this.logger.log('Listed solution images', {
      count: urls.length,
      projectId,
      solutionId,
    });
    return urls;
  }
}
