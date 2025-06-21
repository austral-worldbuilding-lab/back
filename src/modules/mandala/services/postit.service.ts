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
          postitsWithCoordinates.push({ ...postit, coordinates });
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
        parentId: aiPostit.parentId || null,
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

    const postitWithId = {
      ...postit,
      id: randomUUID(),
      parentId: postit.parentId || null,
    };

    const existingPostits = currentDocument.postits || [];
    const updatedPostits = [...existingPostits, postitWithId];

    await this.firebaseDataService.updateDocument(
      projectId,
      {
        postits: updatedPostits,
        updatedAt: new Date(),
      },
      mandalaId,
    );

    return postitWithId;
  }

  async deletePostit(
    projectId: string,
    mandalaId: string,
    postitId: string,
  ): Promise<Postit[]> {
    const currentDocument = (await this.firebaseDataService.getDocument(
      projectId,
      mandalaId,
    )) as FirestoreMandalaDocument | null;

    if (!currentDocument) {
      throw new BusinessLogicException('Mandala not found', { mandalaId });
    }

    const postits = currentDocument.postits || [];

    // Find the postit to be deleted
    const postitToDelete = postits.find(p => p.id === postitId);
    if (!postitToDelete) {
      throw new BusinessLogicException('Postit not found', { postitId });
    }
    // Find all children post-its to be deleted
    const childrenPostitsToDelete = this.findChildrenPostits(postits, postitId);
    
    // Delete the postit to be deleted and all its children
    const postitsToDelete = [postitToDelete, ...childrenPostitsToDelete];
    const postitIdsToDelete = new Set(postitsToDelete.map(p => p.id));
    const updatedPostits = postits.filter(
      (p) => !postitIdsToDelete.has(p.id),
    );

    await this.firebaseDataService.updateDocument(
      projectId,
      {
        postits: updatedPostits,
        updatedAt: new Date(),
      },
      mandalaId,
    );

    return postitsToDelete;
  }

  /**
   * Recursively finds all children post-its that should be deleted when removing a father post-it.
   * This includes all descendants in the hierarchy (children, grandchildren, etc.).
   * 
   * @param postits - Array of all post-its in the mandala document
   * @param parentId - ID of the parent post-it whose children should be deleted
   * @returns Array of post-it IDs that should be deleted (only children, not including parent)
   * 
   * Example hierarchy:
   * Postit A (id: "a")
   * ├── Postit B (fatherId: "a")
   * │   ├── Postit D (fatherId: "b")
   * │   └── Postit E (fatherId: "b")
   * └── Postit C (fatherId: "a")
   *     └── Postit F (fatherId: "c")
   * 
   * If we delete Postit A, this method returns: ["b", "d", "e", "c", "f"]
   * (Postit A is handled separately before calling this method)
   */
  private findChildrenPostits(postits: Postit[], parentId: string): Postit[] {
    const childrenPostits = [];
    
    // Find direct children
    const directChildren = postits.filter(postit => postit.parentId === parentId);
    
    // Recursively find children of children
    for (const child of directChildren) {
      const childIds = this.findChildrenPostits(postits, child.id);
      childrenPostits.push(...childIds);
    }
    
    return childrenPostits;
  }
}
