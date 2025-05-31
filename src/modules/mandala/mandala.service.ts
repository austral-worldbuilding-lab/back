import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  ResourceNotFoundException,
  InternalServerErrorException,
  BusinessLogicException,
} from '@common/exceptions/custom-exceptions';
import { CreateMandalaDto } from './dto/create-mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { MandalaRepository } from './mandala.repository';
import { MandalaDto } from './dto/mandala.dto';
import { PaginatedResponse } from '@common/types/responses';
import { FirebaseDataService } from '@modules/firebase/firebase-data.service';
import { AiService } from '@modules/ai/ai.service';
import { PostitWithCoordinates } from './types/postits';
import { MandalaWithPostitsDto } from './dto/mandala-with-postits.dto';
import { PostitPositioningService } from './services/postit-positioning.service';

@Injectable()
export class MandalaService {
  constructor(
    private mandalaRepository: MandalaRepository,
    private firebaseDataService: FirebaseDataService,
    private aiService: AiService,
    private postitPositioningService: PostitPositioningService,
  ) {}

  async create(createMandalaDto: CreateMandalaDto): Promise<MandalaDto> {
    const mandala = await this.mandalaRepository.create(createMandalaDto);

    try {
      const firestoreData: MandalaWithPostitsDto = {
        mandala,
        postits: [],
      };
      await this.firebaseDataService.createDocument(
        createMandalaDto.projectId,
        firestoreData,
        mandala.id,
      );
    } catch (error: unknown) {
      await this.remove(mandala.id);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException({
        message: 'Error synchronizing the mandala with Firestore',
        error: 'Firestore Sync Error',
        details: { mandalaId: mandala.id, originalError: errorMessage },
      });
    }

    return mandala;
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
      throw new ResourceNotFoundException('Mandala', id);
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

  async generate(
    createMandalaDto: CreateMandalaDto,
  ): Promise<MandalaWithPostitsDto> {
    if (!createMandalaDto.projectId) {
      throw new BadRequestException(
        'Project ID is required to generate mandala',
      );
    }
    const projectId = createMandalaDto.projectId;

    // Create mandala first
    const mandala: MandalaDto = await this.create(createMandalaDto);

    try {
      // Generate postits using AI service
      const postits = await this.aiService.generatePostits(projectId);
      if (!postits || postits.length === 0) {
        throw new BusinessLogicException(
          'No postits received from AI service',
          {
            projectId,
            mandalaId: mandala.id,
          },
        );
      }
      const postitsWithCoordinates: PostitWithCoordinates[] = postits
        .map((postit) => ({
          ...postit,
          coordinates: this.postitPositioningService.getRandomCoordinates(
            postit.dimension,
            postit.section,
          ),
        }))
        .filter(
          (postit): postit is PostitWithCoordinates =>
            postit.coordinates !== null,
        );

      // If no valid postits were generated, throw error
      if (postitsWithCoordinates.length === 0) {
        throw new BusinessLogicException('No valid postits were generated', {
          projectId,
          mandalaId: mandala.id,
          totalPostits: postits.length,
        });
      }

      const firestoreData: MandalaWithPostitsDto = {
        mandala: mandala,
        postits: postitsWithCoordinates,
      };

      // Create in Firestore
      await this.firebaseDataService.createDocument(
        projectId,
        firestoreData,
        mandala.id,
      );

      return firestoreData;
    } catch (error) {
      // If anything fails, delete the created mandala
      await this.remove(mandala.id);
      throw error;
    }
  }
}
