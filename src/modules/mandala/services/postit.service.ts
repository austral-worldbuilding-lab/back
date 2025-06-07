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
  private readonly defaultDimensions = [
    'Recursos',
    'Cultura',
    'Infraestructura',
    'Economía',
    'Gobierno',
    'Ecología',
  ];
  private readonly defaultSections = ['Persona', 'Comunidad', 'Institución'];

  constructor(
    private aiService: AiService,
    private mandalaRepository: MandalaRepository,
  ) {}

  async generatePostitsForMandala(
    mandalaId: string,
  ): Promise<PostitWithCoordinates[]> {
    const mandala: MandalaDto | null =
      await this.mandalaRepository.findOne(mandalaId);

    if (!mandala) {
      throw new BusinessLogicException('Mandala not found', { mandalaId });
    }

    const postits: Postit[] = await this.aiService.generatePostits(
      mandala.projectId,
    );

    const postitsWithCoordinates: PostitWithCoordinates[] = postits
      .map((postit) => ({
        ...postit,
        coordinates: this.getRandomCoordinates(
          postit.dimension,
          postit.section,
          mandala.configuration.dimensions.map((dim) => dim.name),
          mandala.configuration.scales,
        ),
      }))
      .filter(
        (postit): postit is PostitWithCoordinates =>
          postit.coordinates !== null,
      );

    if (postitsWithCoordinates.length === 0) {
      throw new BusinessLogicException('No valid postits were generated', {
        mandalaId,
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
