import { Injectable } from '@nestjs/common';
import { PostitCoordinates, PostitWithCoordinates } from '../types/postits';
import { AiService } from '@modules/ai/ai.service';
import { BusinessLogicException } from '@common/exceptions/custom-exceptions';

@Injectable()
export class PostitService {
  private readonly defaultDimensions = [
    'Recursos',
    'Cultura',
    'Infraestructura',
    'Economía',
    'Gobierno',
    'Ecología',
  ];
  private readonly defaultSections = ['Persona', 'Comunidad', 'Institución'];

  constructor(private aiService: AiService) {}

  async generatePostits(projectId: string): Promise<PostitWithCoordinates[]> {
    const postits = await this.aiService.generatePostits(projectId);

    if (!postits || postits.length === 0) {
      throw new BusinessLogicException('No postits received from AI service', {
        projectId,
      });
    }

    const postitsWithCoordinates = postits
      .map((postit) => ({
        ...postit,
        coordinates: this.getRandomCoordinates(
          postit.dimension,
          postit.section,
          this.defaultDimensions,
          this.defaultSections,
        ),
      }))
      .filter(
        (postit): postit is PostitWithCoordinates =>
          postit.coordinates !== null,
      );

    if (postitsWithCoordinates.length === 0) {
      throw new BusinessLogicException('No valid postits were generated', {
        projectId,
        totalPostits: postits.length,
      });
    }

    return postitsWithCoordinates;
  }

  getRandomCoordinates(
    dimension: string,
    section: string,
    dimensions: string[] = this.defaultDimensions,
    sections: string[] = this.defaultSections,
  ): PostitCoordinates | null {
    const dimIndex = dimensions.indexOf(dimension);
    const secIndex = sections.indexOf(section);

    // Filter out invalid dimensions or sections
    if (dimIndex === -1 || secIndex === -1) return null;

    const anglePerDim = (2 * Math.PI) / dimensions.length;
    const startAngle = dimIndex * anglePerDim;
    const angle = startAngle + Math.random() * anglePerDim;

    const sectionRadiusMin = secIndex / sections.length;
    const sectionRadiusMax = (secIndex + 1) / sections.length;
    const percentileDistance =
      sectionRadiusMin + Math.random() * (sectionRadiusMax - sectionRadiusMin);

    const x = percentileDistance * Math.cos(angle);
    const y = percentileDistance * Math.sin(angle);

    return {
      x, // percentile
      y, // percentile
      angle, // radians
      percentileDistance, // between 0 and 1, distance from the center to exterior
    };
  }
}
