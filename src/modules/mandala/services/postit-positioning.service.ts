import { Injectable } from '@nestjs/common';
import { PostitCoordinates } from '../types/postits';

@Injectable()
export class PostitPositioningService {
  getRandomCoordinates(
    dimension: string,
    section: string,
    dimensions: string[] = [
      'Recursos',
      'Cultura',
      'Infraestructura',
      'Economía',
      'Gobierno',
      'Ecología',
    ],
    sections: string[] = ['Persona', 'Comunidad', 'Institución'],
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
