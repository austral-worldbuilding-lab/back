import { Injectable } from '@nestjs/common';
import {
  Postit,
  PostitCoordinates,
  PostitWithCoordinates,
  PostitTag,
  AiPostitResponse,
} from '../types/postits';
import { AiService } from '@modules/ai/ai.service';
import { BusinessLogicException } from '@common/exceptions/custom-exceptions';
import { MandalaRepository } from '../mandala.repository';
import { MandalaDto } from '@modules/mandala/dto/mandala.dto';
import { ProjectService } from '@modules/project/project.service';
import { TagDto } from '@modules/project/dto/tag.dto';
import { FirebaseDataService } from '@modules/firebase/firebase-data.service';
import { FirestoreMandalaDocument } from '@/modules/firebase/types/firestore-character.type';
import { randomUUID } from 'crypto';
import { CreatePostitDto } from '../dto/postit/create-postit.dto';
import {
  addPostitToParent,
  deletePostitFromTree,
} from '../utils/postit-tree.utils';

@Injectable()
export class PostitService {
  constructor(
    private aiService: AiService,
    private mandalaRepository: MandalaRepository,
    private projectService: ProjectService,
    private firebaseDataService: FirebaseDataService,
  ) {}

  async generatePostitsForMandala(
    mandalaId: string,
  ): Promise<PostitWithCoordinates[]> {
    const mandala = await this.getMandalaOrThrow(mandalaId);
    const postits = await this.generatePostits(mandala);

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
          mandala.configuration.dimensions.map((dim) => dim.name),
          mandala.configuration.scales,
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

  private async getMandalaOrThrow(mandalaId: string): Promise<MandalaDto> {
    const mandala = await this.mandalaRepository.findOne(mandalaId);
    if (!mandala) {
      throw new BusinessLogicException('Mandala not found', { mandalaId });
    }
    return mandala;
  }

  private async generatePostits(mandala: MandalaDto): Promise<Postit[]> {
    const projectTags = await this.projectService.getProjectTags(
      mandala.projectId,
    );

    const tagNames = projectTags.map((tag) => tag.name);

    const aiResponse: AiPostitResponse[] = await this.aiService.generatePostits(
      mandala.projectId,
      mandala.configuration.dimensions.map((dim) => dim.name),
      mandala.configuration.scales,
      mandala.configuration.center.name,
      mandala.configuration.center.description || 'N/A',
      tagNames,
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

  private mapTagsWithColors(
    tagNames: string[],
    projectTags: TagDto[],
  ): PostitTag[] {
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
      .filter((tag): tag is PostitTag => tag !== null);
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

  async createPostit(
    projectId: string,
    mandalaId: string,
    postit: CreatePostitDto,
  ): Promise<PostitWithCoordinates> {
    const currentDocument = (await this.firebaseDataService.getDocument(
      projectId,
      mandalaId,
    )) as FirestoreMandalaDocument | null;

    if (!currentDocument) {
      throw new BusinessLogicException('Mandala not found', { mandalaId });
    }

    const newPostitId = randomUUID();

    // Convert DTO to plain object to avoid Firestore serialization issues
    const plainPostit = {
      id: newPostitId,
      content: postit.content,
      dimension: postit.dimension,
      section: postit.section,
      tags: postit.tags.map((tag) => ({
        name: tag.name,
        color: tag.color,
      })),
      childrens: [], // Initialize empty children array
      coordinates: {
        x: postit.coordinates.x,
        y: postit.coordinates.y,
        angle: postit.coordinates.angle,
        percentileDistance: postit.coordinates.percentileDistance,
      },
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
