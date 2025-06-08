import { Injectable } from '@nestjs/common';
import {
  Postit,
  PostitCoordinates,
  PostitWithCoordinates,
} from '../types/postits';
import { AiService } from '@modules/ai/ai.service';
import { BusinessLogicException } from '@common/exceptions/custom-exceptions';
import { MandalaRepository } from '../mandala.repository';
import { MandalaDto } from '@modules/mandala/dto/mandala.dto';

@Injectable()
export class PostitService {
  constructor(
    private aiService: AiService,
    private mandalaRepository: MandalaRepository,
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
    return this.aiService.generatePostits(
      mandala.projectId,
      mandala.configuration.dimensions.map((dim) => dim.name),
      mandala.configuration.scales,
    );
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
    section: string,
    dimensions: string[],
    sections: string[],
    sectionCoordinates: PostitCoordinates[],
    allCoordinates: PostitCoordinates[],
    candidateAttempts: number = 30,
  ): PostitCoordinates | null {
    if (sectionCoordinates.length === 0) {
      return this.getSectionCenterCoordinates(
        dimension,
        section,
        dimensions,
        sections,
      );
    }

    let bestCandidate: PostitCoordinates | null = null;
    let maxMinDistance = -Infinity;

    for (let i = 0; i < candidateAttempts; i++) {
      const candidate = this.generateRandomCoordinatesInSection(
        dimension,
        section,
        dimensions,
        sections,
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
      ...placed.map((p) =>
        Math.sqrt((candidate.x - p.x) ** 2 + (candidate.y - p.y) ** 2),
      ),
    );
  }
}
