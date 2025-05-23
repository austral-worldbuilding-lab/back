import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMandalaDto } from './dto/create-mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { MandalaRepository } from './mandala.repository';
import { MandalaDto } from './dto/mandala.dto';
import { PaginatedResponse } from '../common/types/responses';
import { FirebaseDataService } from '../firebase/firebase-data.service';
import {
  PostitCoordinates,
  Postit,
  PostitWithCoordinates,
} from './types/postits';
import { MandalaWithPostitsDto } from './dto/mandala-with-postits.dto';

@Injectable()
export class MandalaService {
  constructor(
    private mandalaRepository: MandalaRepository,
    private firebaseDataService: FirebaseDataService,
  ) {}

  async create(createMandalaDto: CreateMandalaDto): Promise<MandalaDto> {
    return this.mandalaRepository.create(createMandalaDto);
  }

  async findAllPaginated(
    projectId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<MandalaDto>> {
    const skip = (page - 1) * limit;
    const [mandalas, total] = await this.mandalaRepository.findAllPaginated(
      projectId,
      skip,
      limit,
    );

    return {
      data: mandalas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<MandalaDto> {
    const mandala = await this.mandalaRepository.findOne(id);
    if (!mandala) {
      throw new NotFoundException(`Mandala with ID ${id} not found`);
    }
    return mandala;
  }

  async update(
    id: string,
    updateMandalaDto: UpdateMandalaDto,
  ): Promise<MandalaDto> {
    return this.mandalaRepository.update(id, updateMandalaDto);
  }

  async remove(id: string): Promise<MandalaDto> {
    return this.mandalaRepository.remove(id);
  }

  async generate(createMandalaDto: CreateMandalaDto): Promise<MandalaWithPostitsDto> {
    // 1. Create in Postgres
    const mandala: MandalaDto = await this.create(createMandalaDto);

    // 2. Generate mandala using ia module
    const postits: Postit[] = this.mockIA();

    // 3. Add coordinates to each postit
    const postitsWithCoordinates: PostitWithCoordinates[] = postits.map(
      (postit) => ({
        ...postit,
        coordinates: this.getRandomCoordinates(
          postit.dimension,
          postit.section,
        ),
      }),
    );

    // 4. Prepare Firestore data (add/transform fields as needed)
    const firestoreData: MandalaWithPostitsDto = { 
      mandala: mandala, 
      postits: postitsWithCoordinates 
    };

    // 5. Create in Firestore with the same id
    await this.firebaseDataService.createDocument(
      createMandalaDto.projectId,
      firestoreData,
      mandala.id,
    );

    return firestoreData;
  }

  mockIA(): Postit[] {
    return [
      {
        content: 'Tradición de arrojar alimentos',
        dimension: 'Cultura',
        section: 'Comunidad',
      },
      {
        content: 'Celebración fin de etapa',
        dimension: 'Cultura',
        section: 'Persona',
      },
    ];
  }

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
  ): PostitCoordinates {
    const dimIndex = dimensions.indexOf(dimension);
    const secIndex = sections.indexOf(section);

    if (dimIndex === -1 || secIndex === -1)
      throw new Error('Invalid dimension or section');

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
