import { randomUUID } from 'crypto';

import { BusinessLogicException } from '@common/exceptions/custom-exceptions';
import { AiService } from '@modules/ai/ai.service';
import { CreateFileDto } from '@modules/files/dto/create-file.dto';
import { FileScope } from '@modules/files/types/file-scope.type';
import { FirebaseDataService } from '@modules/firebase/firebase-data.service';
import { MandalaDto } from '@modules/mandala/dto/mandala.dto';
import { UpdatePostitDto } from '@modules/mandala/dto/postit/update-postit.dto';
import { AiMandalaReport } from '@modules/mandala/types/ai-report';
import { PrismaService } from '@modules/prisma/prisma.service';
import { TagDto } from '@modules/project/dto/tag.dto';
import { ProjectService } from '@modules/project/project.service';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { CreatePostitDto } from '../dto/postit/create-postit.dto';
import {
  Postit,
  PostitCoordinates,
  PostitWithCoordinates,
  Tag,
  AiPostitResponse,
  AiPostitComparisonResponse,
  PostitComparison,
} from '../types/postits';
import {
  addPostitToParent,
  deletePostitFromTree,
  updatePostitInTree,
} from '../utils/postit-tree.utils';

import { FirestoreMandalaDocument } from '@/modules/firebase/types/firestore-character.type';

@Injectable()
export class PostitService {
  constructor(
    private aiService: AiService,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
    private firebaseDataService: FirebaseDataService,
    private prisma: PrismaService,
    private storageService: AzureBlobStorageService,
  ) {}

  async collectPostitsWithSource(
    mandalas: MandalaDto[],
  ): Promise<
    (PostitWithCoordinates & { from: { name: string; id: string } })[]
  > {
    const allPostits = await Promise.all(
      mandalas.map(async (mandala) => {
        const document = (await this.firebaseDataService.getDocument(
          mandala.projectId,
          mandala.id,
        )) as FirestoreMandalaDocument | null;

        const postits = document?.postits || [];
        return postits.map((postit) => ({
          ...postit,
          from: {
            name: mandala.name,
            id: mandala.id,
          },
        }));
      }),
    );

    return allPostits.flat();
  }

  transformToPostitsWithCoordinates(
    mandalaId: string,
    postits: Postit[],
    dimensions: string[],
    scales: string[],
  ): PostitWithCoordinates[] {
    const postitsBySection = this.groupPostitsBySection(postits);

    const coordinatesBySection: Record<string, PostitCoordinates[]> = {};
    const allCoordinates: PostitCoordinates[] = [];
    const postitsWithCoordinates: PostitWithCoordinates[] = [];

    for (const sectionKey in postitsBySection) {
      const [dimension, section] = this.parseSectionKey(sectionKey);
      coordinatesBySection[sectionKey] = [];
      for (const postit of postitsBySection[sectionKey]) {
        const coordinates = this.findOptimalCoordinates(
          dimension,
          section,
          dimensions,
          scales,
          coordinatesBySection[sectionKey],
          allCoordinates,
        );
        if (coordinates) {
          postitsWithCoordinates.push({
            ...postit,
            coordinates,
            childrens: postit.childrens as PostitWithCoordinates[],
          });
          coordinatesBySection[sectionKey].push(coordinates);
          allCoordinates.push(coordinates);
        }
      }
    }

    if (postitsWithCoordinates.length === 0) {
      throw new BusinessLogicException('No valid postits were generated', {
        mandalaId,
        totalPostits: postits.length,
      });
    }

    return postitsWithCoordinates;
  }

  async generatePostits(
    mandala: MandalaDto,
    dimensions: string[],
    scales: string[],
    selectedFiles?: string[],
  ): Promise<Postit[]> {
    const projectTags = await this.projectService.getProjectTags(
      mandala.projectId,
    );

    const tagNames = projectTags.map((tag) => tag.name);

    // Get project information
    const project = await this.projectService.findOne(mandala.projectId);

    const aiResponse: AiPostitResponse[] = await this.aiService.generatePostits(
      mandala.projectId,
      project.name,
      project.description || '',
      dimensions,
      scales,
      mandala.configuration.center.name,
      mandala.configuration.center.description || 'N/A',
      tagNames,
      selectedFiles,
      mandala.id,
    );

    return aiResponse.map(
      (aiPostit: AiPostitResponse): Postit => ({
        id: randomUUID(),
        content: aiPostit.content,
        dimension: aiPostit.dimension,
        section: aiPostit.section,
        tags: this.mapTagsWithColors(aiPostit.tags, projectTags),
        // TODO: linkedToId is not used in the mandala generation by AI yet
        childrens: [],
      }),
    );
  }

  async generateComparisonPostits(
    mandalas: MandalaDto[],
    mandalasDocument: FirestoreMandalaDocument[],
  ): Promise<{ comparisons: PostitComparison[]; report: AiMandalaReport }> {
    const projectTags = await this.projectService.getProjectTags(
      mandalas[0].projectId, // Use first mandala's project for tags
    );

    // Get project information
    const project = await this.projectService.findOne(mandalas[0].projectId);

    const { comparisons: aiComparisons, report } =
      await this.aiService.generatePostitsSummary(
        mandalas[0].projectId, // TODO: unificar si más adelante soportan multi-proyecto
        project.name,
        project.description || '',
        mandalas,
        mandalasDocument,
      );

    const comparisons: PostitComparison[] = aiComparisons.map(
      (aiPostit: AiPostitComparisonResponse): PostitComparison => ({
        id: randomUUID(),
        content: aiPostit.content,
        dimension: aiPostit.dimension,
        section: aiPostit.section, // ya normalizado por el adapter (scale -> section)
        tags: this.mapTagsWithColors(aiPostit.tags, projectTags),
        childrens: [],
        type: aiPostit.type,
        fromSummary: aiPostit.fromSummary,
      }),
    );

    return { comparisons, report };
  }

  private mapTagsWithColors(tagNames: string[], projectTags: TagDto[]): Tag[] {
    if (!tagNames || tagNames.length === 0) return [];

    return tagNames
      .map((tagName) => {
        const projectTag = projectTags.find((pt) => pt.name === tagName);
        if (!projectTag) return null;
        return {
          name: projectTag.name,
          color: projectTag.color,
        };
      })
      .filter((tag): tag is Tag => tag !== null);
  }

  private groupPostitsBySection(postits: Postit[]): Record<string, Postit[]> {
    return postits.reduce(
      (sections, postit) => {
        const sectionKey = this.createSectionKey(
          postit.dimension,
          postit.section,
        );
        if (!sections[sectionKey]) sections[sectionKey] = [];
        sections[sectionKey].push(postit);
        return sections;
      },
      {} as Record<string, Postit[]>,
    );
  }

  private createSectionKey(dimension: string, section: string): string {
    return `${dimension}::${section}`;
  }

  private parseSectionKey(sectionKey: string): [string, string] {
    const [dimension, section] = sectionKey.split('::');
    return [dimension, section];
  }

  private findOptimalCoordinates(
    dimension: string,
    scale: string,
    dimensions: string[],
    scales: string[],
    sectionCoordinates: PostitCoordinates[],
    allCoordinates: PostitCoordinates[],
    candidateAttempts: number = 30,
  ): PostitCoordinates | null {
    if (!dimensions.includes(dimension) || !scales.includes(scale)) {
      return null;
    }

    if (sectionCoordinates.length === 0) {
      return this.getSectionCenterCoordinates(
        dimension,
        scale,
        dimensions,
        scales,
      );
    }

    let bestCandidate: PostitCoordinates | null = null;
    let maxMinDistance = -Infinity;

    for (let i = 0; i < candidateAttempts; i++) {
      const candidate = this.generateRandomCoordinatesInSection(
        dimension,
        scale,
        dimensions,
        scales,
      );
      const minDistance = this.getMinDistanceToPlaced(
        candidate,
        allCoordinates,
      );
      if (minDistance > maxMinDistance) {
        maxMinDistance = minDistance;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  private getSectionCenterCoordinates(
    dimension: string,
    section: string,
    dimensions: string[],
    sections: string[],
  ): PostitCoordinates {
    const { startAngle, endAngle, minRadius, maxRadius } =
      this.getSectionBounds(dimension, section, dimensions, sections);
    const angle = (startAngle + endAngle) / 2;
    const radius = (minRadius + maxRadius) / 2;
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  }

  private generateRandomCoordinatesInSection(
    dimension: string,
    section: string,
    dimensions: string[],
    sections: string[],
  ): PostitCoordinates {
    const { startAngle, angleSpan, minRadius, maxRadius } =
      this.getSectionBounds(dimension, section, dimensions, sections);
    const angle = startAngle + Math.random() * angleSpan;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  }

  private getSectionBounds(
    dimension: string,
    section: string,
    dimensions: string[],
    sections: string[],
  ) {
    const dimensionIndex = dimensions.indexOf(dimension);
    const sectionIndex = sections.indexOf(section);
    const angleSpan = (2 * Math.PI) / dimensions.length;
    const startAngle = dimensionIndex * angleSpan;
    const endAngle = startAngle + angleSpan;
    const minRadius = sectionIndex / sections.length;
    const maxRadius = (sectionIndex + 1) / sections.length;
    return { startAngle, endAngle, angleSpan, minRadius, maxRadius };
  }

  private getMinDistanceToPlaced(
    candidate: PostitCoordinates,
    placed: PostitCoordinates[],
  ): number {
    if (placed.length === 0) return Infinity;
    return Math.min(
      ...placed.map((p) => (candidate.x - p.x) ** 2 + (candidate.y - p.y) ** 2),
    );
  }

  private generateCoordinatesForPostit(
    postit: CreatePostitDto,
    mandala: MandalaDto | undefined,
    existingPostits: PostitWithCoordinates[],
  ): PostitCoordinates {
    // If coordinates are explicitly provided, use them
    if (postit.coordinates) {
      return {
        x: postit.coordinates.x,
        y: postit.coordinates.y,
      };
    }

    // If dimension and section are provided, generate coordinates
    if (mandala && postit.dimension && postit.section) {
      const dimensions = mandala.configuration.dimensions.map((d) => d.name);
      const scales = mandala.configuration.scales;
      const allCoordinates = existingPostits.map((p) => p.coordinates);

      const smartCoordinates = this.findOptimalCoordinates(
        postit.dimension,
        postit.section,
        dimensions,
        scales,
        [],
        allCoordinates,
      );

      if (smartCoordinates) {
        return smartCoordinates;
      }
    }

    // Default fallback
    return { x: 0, y: 0 };
  }

  async createPostit(
    projectId: string,
    mandalaId: string,
    postit: CreatePostitDto,
    mandala?: MandalaDto,
  ): Promise<PostitWithCoordinates> {
    const currentDocument = (await this.firebaseDataService.getDocument(
      projectId,
      mandalaId,
    )) as FirestoreMandalaDocument | null;

    if (!currentDocument) {
      throw new BusinessLogicException('Mandala not found', { mandalaId });
    }

    const newPostitId = randomUUID();

    // Generate presigned URL if imageFileName is provided
    let presignedUrl: string | undefined;
    if (postit.imageFileName) {
      const mandala = await this.prisma.mandala.findFirst({
        where: { id: mandalaId, isActive: true },
        select: {
          projectId: true,
          project: { select: { organizationId: true } },
        },
      });

      if (!mandala) {
        throw new BusinessLogicException('Mandala not found', { mandalaId });
      }

      if (!mandala.project.organizationId) {
        throw new BusinessLogicException('Organization not found for mandala', {
          mandalaId,
        });
      }

      const fileScope: FileScope = {
        orgId: mandala.project.organizationId,
        projectId: mandala.projectId,
        mandalaId: mandalaId,
      };

      const createFileDto: CreateFileDto = {
        file_name: postit.imageFileName,
        file_type: 'image/*',
      };

      const presignedUrls = await this.storageService.uploadFiles(
        [createFileDto],
        fileScope,
        'images',
      );
      presignedUrl = presignedUrls[0]?.url;
    }

    // Generate optimal coordinates for the postit
    const existingPostits = currentDocument.postits || [];
    const finalCoordinates = this.generateCoordinatesForPostit(
      postit,
      mandala,
      existingPostits,
    );

    // Convert DTO to plain object to avoid Firestore serialization issues
    const plainPostit = {
      id: newPostitId,
      content: postit.content,
      dimension: postit.dimension || '',
      section: postit.section || '',
      tags: postit.tags.map((tag) => ({
        name: tag.name,
        color: tag.color,
      })),
      childrens: [], // Initialize empty children array
      coordinates: finalCoordinates,
      ...(postit.imageFileName && { imageFileName: postit.imageFileName }),
      ...(presignedUrl && { presignedUrl }),
    };

    const currentPostits = currentDocument.postits || [];
    let updatedPostits: PostitWithCoordinates[];

    if (postit.parentId) {
      const result = addPostitToParent(
        currentPostits,
        postit.parentId,
        plainPostit,
      );

      if (!result.found) {
        throw new BusinessLogicException('Parent postit not found', {
          parentId: postit.parentId,
        });
      }

      updatedPostits = result.postits;
    } else {
      updatedPostits = [...currentPostits, plainPostit];
    }

    await this.firebaseDataService.updateDocument(
      projectId,
      {
        postits: updatedPostits,
        updatedAt: new Date(),
      },
      mandalaId,
    );

    return plainPostit;
  }

  async updatePostit(
    projectId: string,
    mandalaId: string,
    postitId: string,
    updateData: UpdatePostitDto,
  ): Promise<PostitWithCoordinates> {
    const currentDocument = (await this.firebaseDataService.getDocument(
      projectId,
      mandalaId,
    )) as FirestoreMandalaDocument | null;

    if (!currentDocument) {
      throw new BusinessLogicException('Mandala not found', { mandalaId });
    }

    const postits = currentDocument.postits || [];

    const updateDataForTree = {
      content: updateData.content,
      tags: updateData.tags.map((tag) => ({
        name: tag.name,
        color: tag.color,
      })),
    };

    const result = updatePostitInTree(postits, postitId, updateDataForTree);

    if (!result.found) {
      throw new BusinessLogicException('Postit not found', { postitId });
    }

    await this.firebaseDataService.updateDocument(
      projectId,
      {
        postits: result.postits,
        updatedAt: new Date(),
      },
      mandalaId,
    );

    return result.updatedPostit!;
  }

  async deletePostit(
    projectId: string,
    mandalaId: string,
    postitId: string,
  ): Promise<void> {
    const currentDocument = (await this.firebaseDataService.getDocument(
      projectId,
      mandalaId,
    )) as FirestoreMandalaDocument | null;

    if (!currentDocument) {
      throw new BusinessLogicException('Mandala not found', { mandalaId });
    }

    const postits = currentDocument.postits || [];

    const result = deletePostitFromTree(postits, postitId);
    if (!result.found) {
      throw new BusinessLogicException('Postit not found', { postitId });
    }

    await this.firebaseDataService.updateDocument(
      projectId,
      {
        postits: result.postits,
        updatedAt: new Date(),
      },
      mandalaId,
    );
  }
}
