import { BusinessLogicException } from '@common/exceptions/custom-exceptions';
import { AppLogger } from '@common/services/logger.service';
import { GoogleGenAI } from '@google/genai';
import { GenerateImagesConfig } from '@google/genai/dist/genai';
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
        const imageData = await this.generateImageFromPrompt(
          imagePrompt.prompt,
        );
        const fileName = this.generateFileName(solutionId, i, imagePrompt);
        await this.saveImageToStorage(imageData, fileName, fileScope);
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
   * Generates an image from a text prompt using Gemini
   */
  private async generateImageFromPrompt(
    prompt: string,
  ): Promise<{ id: string; imageData: string }> {
    const config = {
      aspectRatio: '1:1',
      numberOfImages: 1,
    } as GenerateImagesConfig;

    const contents = [
      {
        role: 'user' as const,
        parts: [{ text: prompt }],
      },
    ];

    const response = await this.ai.models.generateContent({
      model: this.geminiImageModel,
      contents,
      config,
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        return {
          id: `solution-image-${Date.now()}`,
          imageData: imageData || '',
        };
      }
    }

    throw new BusinessLogicException('No image data received from Gemini API');
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

    // Upload to deliverables folder
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
    index: number,
    imagePrompt: SolutionImageResponse,
  ): string {
    // Create a deterministic name: solution-{solutionId}-{index}-{dimension}-{scale}.png
    const dimensionSlug = imagePrompt.dimension
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 20);
    const scaleSlug = imagePrompt.scale
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 20);
    return `solution-${solutionId}-${index}-${dimensionSlug}-${scaleSlug}.png`;
  }
}
