import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  ResourceNotFoundException,
  InternalServerErrorException,
} from '@common/exceptions/custom-exceptions';
import { CreateMandalaDto } from './dto/create-mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { MandalaRepository } from './mandala.repository';
import { MandalaDto } from './dto/mandala.dto';
import { PaginatedResponse } from '@common/types/responses';
import { FirebaseDataService } from '@modules/firebase/firebase-data.service';
import { MandalaWithPostitsAndLinkedCentersDto } from './dto/mandala-with-postits-and-linked-centers.dto';
import { PostitService } from './services/postit.service';
import { PostitWithCoordinates } from '@modules/mandala/types/postits';
import { ProjectService } from '@modules/project/project.service';

@Injectable()
export class MandalaService {
  private readonly logger = new Logger(MandalaService.name);

  constructor(
    private mandalaRepository: MandalaRepository,
    private firebaseDataService: FirebaseDataService,
    private postitService: PostitService,
    private projectService: ProjectService,
  ) {}

  private async completeMissingVariables(
    createMandalaDto: CreateMandalaDto,
  ): Promise<CreateMandalaDto> {
    if (!createMandalaDto.dimensions || !createMandalaDto.scales) {
      const project = await this.projectService.findOne(
        createMandalaDto.projectId,
      );
      createMandalaDto.dimensions =
        createMandalaDto.dimensions || project.configuration.dimensions;
      createMandalaDto.scales =
        createMandalaDto.scales || project.configuration.scales;
    }
    return createMandalaDto;
  }

  async create(createMandalaDto: CreateMandalaDto): Promise<MandalaDto> {
    const completeDto: CreateMandalaDto =
      await this.completeMissingVariables(createMandalaDto);
    const mandala: MandalaDto =
      await this.mandalaRepository.create(completeDto);

    try {
      const firestoreData: MandalaWithPostitsAndLinkedCentersDto = {
        mandala,
        postits: [],
        linkedMandalasCenter:
          await this.mandalaRepository.findLinkedMandalasCenters(mandala.id),
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
    if (mandala.linkedToId) {
      await this.updateParentMandalaDocument(mandala.linkedToId);
      this.logger.log(
        `Parent mandala ${mandala.linkedToId} document updated for mandala ${mandala.id}`,
      );
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

  async updateParentMandalaDocument(parentMandalaId: string): Promise<void> {
    try {
      // Get the parent mandala
      const parentMandala =
        await this.mandalaRepository.findOne(parentMandalaId);
      if (!parentMandala) {
        throw new ResourceNotFoundException('Parent Mandala', parentMandalaId);
      }

      // Get updated linked mandalas centers
      const linkedMandalasCenter =
        await this.mandalaRepository.findLinkedMandalasCenters(parentMandalaId);

      // Update the Firebase document with new linked centers
      const updateData = {
        linkedMandalasCenter: linkedMandalasCenter,
      };

      await this.firebaseDataService.updateDocument(
        parentMandala.projectId,
        updateData,
        parentMandalaId,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException({
        message: 'Error updating parent mandala document in Firestore',
        error: 'Firestore Update Error',
        details: { parentMandalaId, originalError: errorMessage },
      });
    }
  }

  async generate(
    createMandalaDto: CreateMandalaDto,
  ): Promise<MandalaWithPostitsAndLinkedCentersDto> {
    if (!createMandalaDto.projectId) {
      throw new BadRequestException(
        'Project ID is required to generate mandala',
      );
    }

    // Create mandala first
    const mandala: MandalaDto = await this.create(createMandalaDto);

    try {
      // Generate postits using mandala's configuration
      const postits: PostitWithCoordinates[] =
        await this.postitService.generatePostitsForMandala(mandala.id);

      const firestoreData: MandalaWithPostitsAndLinkedCentersDto = {
        mandala: mandala,
        postits: postits,
        linkedMandalasCenter:
          await this.mandalaRepository.findLinkedMandalasCenters(mandala.id),
      };

      // Create in Firestore
      await this.firebaseDataService.createDocument(
        createMandalaDto.projectId,
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
