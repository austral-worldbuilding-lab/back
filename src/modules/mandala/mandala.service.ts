import {
  BadRequestException,
  ResourceNotFoundException,
  InternalServerErrorException,
  ExternalServiceException,
} from '@common/exceptions/custom-exceptions';
import { PaginatedResponse } from '@common/types/responses';
import { AiService } from '@modules/ai/ai.service';
import { FirebaseDataService } from '@modules/firebase/firebase-data.service';
import { PostitWithCoordinates } from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions';
import { ProjectService } from '@modules/project/project.service';
import { Injectable, Logger } from '@nestjs/common';

import {
  FirestoreMandalaDocument,
  FirestoreCharacter,
} from '../firebase/types/firestore-character.type';

import {
  OVERLAP_ERROR_MESSAGES,
  OVERLAP_ERROR_TYPES,
} from './constants/overlap-error-messages';
import { CharacterListItemDto } from './dto/character-list-item.dto';
import {
  CreateMandalaCenterDto,
  CreateMandalaDto,
} from './dto/create-mandala.dto';
import { CreateOverlappedMandalaDto } from './dto/create-overlapped-mandala.dto';
import { FilterSectionDto } from './dto/filter-option.dto';
import { MandalaWithPostitsAndLinkedCentersDto } from './dto/mandala-with-postits-and-linked-centers.dto';
import { MandalaDto } from './dto/mandala.dto';
import { OverlapMandalasDto } from './dto/overlap-mandalas.dto';
import { OverlapResultDto } from './dto/overlap-result.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { MandalaRepository } from './mandala.repository';
import { PostitService } from './services/postit.service';
import { calculateAverageColor } from './utils/color-utils';
import { getEffectiveDimensionsAndScales } from './utils/mandala-config.util';
import {
  validateSameDimensions,
  validateSameScales,
  getTargetProjectId,
} from './utils/overlap-validation.utils';

import { DimensionDto } from '@/common/dto/dimension.dto';

@Injectable()
export class MandalaService {
  private readonly logger = new Logger(MandalaService.name);

  constructor(
    private mandalaRepository: MandalaRepository,
    private firebaseDataService: FirebaseDataService,
    private postitService: PostitService,
    private projectService: ProjectService,
    private aiService: AiService,
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
      const childrenCenter = (
        await this.mandalaRepository.findChildrenMandalasCenters(mandala.id)
      ).map((center) => ({
        id: center.id,
        name: center.name,
        description: center.description,
        color: center.color,
        position: { x: 0, y: 0 },
        section: '',
        dimension: '',
      }));

      const firestoreData = {
        mandala,
        postits: [],
        characters: childrenCenter,
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

    if (mandala.parentIds && mandala.parentIds.length > 0) {
      for (const parentId of mandala.parentIds) {
        await this.updateParentMandalaDocument(parentId);
        this.logger.log(
          `Parent mandala ${parentId} document updated for mandala ${mandala.id}`,
        );
      }
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
    const mandala = await this.findOne(id);

    try {
      await this.firebaseDataService.deleteDocument(mandala.projectId, id);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceException(
        'Firebase',
        'Failed to delete mandala document',
        { mandalaId: id, originalError: errorMessage },
      );
    }

    const deletedMandala = await this.mandalaRepository.remove(id);

    // Update all parent mandalas to remove this child
    if (mandala.parentIds && mandala.parentIds.length > 0) {
      for (const parentId of mandala.parentIds) {
        await this.removeChildFromParentFirestore(parentId, id).catch(
          (error: unknown) => {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
              `Failed to remove child ${id} from parent mandala ${parentId}: ${errorMessage}`,
            );
          },
        );
      }
    }

    return deletedMandala;
  }

  async findAvailableMandalasForLinking(
    mandalaId: string,
  ): Promise<CharacterListItemDto[]> {
    const mandala = await this.findOne(mandalaId);
    const availableCharacters =
      await this.mandalaRepository.findAvailableMandalasForLinking(
        mandalaId,
        mandala.projectId,
      );
    return availableCharacters || [];
  }

  async removeChildFromParentFirestore(
    parentMandalaId: string,
    deletedChildId: string,
  ): Promise<void> {
    const parentMandala = await this.findOne(parentMandalaId);

    try {
      const currentDocument = (await this.firebaseDataService.getDocument(
        parentMandala.projectId,
        parentMandalaId,
      )) as FirestoreMandalaDocument;

      const existingCharacters: FirestoreCharacter[] =
        currentDocument.characters || [];

      const updatedCharacters = existingCharacters.filter(
        (character) => character.id !== deletedChildId,
      );

      await this.firebaseDataService.updateDocument(
        parentMandala.projectId,
        { characters: updatedCharacters },
        parentMandalaId,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalServiceException(
        'Firebase',
        'Failed to remove child from parent mandala document',
        {
          parentMandalaId,
          deletedChildId,
          originalError: errorMessage,
        },
      );
    }
  }

  async updateParentMandalaDocument(parentMandalaId: string): Promise<void> {
    const parentMandala = await this.mandalaRepository.findOne(parentMandalaId);

    if (!parentMandala) {
      throw new ResourceNotFoundException('Parent Mandala', parentMandalaId);
    }

    try {
      const currentDocument = (await this.firebaseDataService.getDocument(
        parentMandala.projectId,
        parentMandalaId,
      )) as FirestoreMandalaDocument;

      const existingCharacters: FirestoreCharacter[] =
        currentDocument.characters || [];

      const childrenCenter =
        await this.mandalaRepository.findChildrenMandalasCenters(
          parentMandalaId,
        );

      const existingCharactersMap = new Map(
        existingCharacters.map((char) => [char.id, char]),
      );

      const updatedCharacters = childrenCenter.map((center) => {
        const existingCharacter = existingCharactersMap.get(center.id);

        if (existingCharacter) {
          return {
            ...existingCharacter,
            name: center.name,
            description: center.description,
            color: center.color,
          };
        }

        return {
          id: center.id,
          name: center.name,
          description: center.description,
          color: center.color,
          position: { x: 0, y: 0 },
          section: '',
          dimension: '',
        };
      });

      const updateData = {
        characters: updatedCharacters,
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

    const mandala: MandalaDto = await this.create(createMandalaDto);

    try {
      const postits: PostitWithCoordinates[] =
        await this.postitService.generatePostitsForMandala(
          mandala.id,
          mandala.configuration.dimensions.map((d) => d.name),
          mandala.configuration.scales,
        );

      const childrenCenter = (
        await this.mandalaRepository.findChildrenMandalasCenters(mandala.id)
      ).map((center) => ({
        name: center.name,
        description: center.description,
        color: center.color,
        position: { x: 0, y: 0 },
        section: '',
        dimension: '',
      }));

      const firestoreData: MandalaWithPostitsAndLinkedCentersDto = {
        mandala: mandala,
        postits: postits,
        childrenCenter,
      };

      await this.firebaseDataService.createDocument(
        createMandalaDto.projectId,
        {
          mandala: mandala,
          postits: postits,
          characters: childrenCenter,
        },
        mandala.id,
      );

      return firestoreData;
    } catch (error) {
      await this.remove(mandala.id);
      throw error;
    }
  }

  async getFilters(mandalaId: string): Promise<FilterSectionDto[]> {
    const mandala = await this.findOne(mandalaId);
    if (!mandala) {
      throw new ResourceNotFoundException('Mandala', mandalaId);
    }

    const project = await this.projectService.findOne(mandala.projectId);
    if (!project) {
      throw new ResourceNotFoundException('Project', mandala.projectId);
    }

    const projectTags = await this.projectService.getProjectTags(
      mandala.projectId,
    );

    const filterSections: FilterSectionDto[] = [];

    if (
      mandala.configuration.dimensions &&
      mandala.configuration.dimensions.length > 0
    ) {
      filterSections.push({
        sectionName: 'Dimensiones',
        type: 'multiple',
        options: mandala.configuration.dimensions.map((dimension) => ({
          label: dimension.name,
          color: dimension.color,
        })),
      });
    }

    if (
      mandala.configuration.scales &&
      mandala.configuration.scales.length > 0
    ) {
      filterSections.push({
        sectionName: 'Escalas',
        type: 'multiple',
        options: mandala.configuration.scales.map((scale) => ({
          label: scale,
        })),
      });
    }

    if (projectTags && projectTags.length > 0) {
      filterSections.push({
        sectionName: 'Tags',
        type: 'multiple',
        options: projectTags.map((tag) => ({
          label: tag.name,
          color: tag.color,
        })),
      });
    }

    return filterSections;
  }

  async linkMandala(parentId: string, childId: string): Promise<MandalaDto> {
    if (parentId === childId) {
      throw new BadRequestException('Cannot link a mandala to itself');
    }

    const parentMandala = await this.findOne(parentId);
    const childMandala = await this.findOne(childId);

    if (!parentMandala) {
      throw new ResourceNotFoundException('Parent Mandala', parentId);
    }
    if (!childMandala) {
      throw new ResourceNotFoundException('Child Mandala', childId);
    }

    if (parentMandala.projectId !== childMandala.projectId) {
      throw new BadRequestException(
        'Mandalas must be in the same project to be linked',
      );
    }

    try {
      const updatedParent = await this.mandalaRepository.linkMandala(
        parentId,
        childId,
      );

      await this.updateParentMandalaDocument(parentId);

      this.logger.log(
        `Mandala ${childId} successfully linked as child of ${parentId}`,
      );

      return updatedParent;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException({
        message: 'Failed to link mandalas',
        error: 'Link Operation Error',
        details: { parentId, childId, originalError: errorMessage },
      });
    }
  }

  async unlinkMandala(parentId: string, childId: string): Promise<MandalaDto> {
    const parentMandala = await this.findOne(parentId);
    const childMandala = await this.findOne(childId);

    if (!parentMandala) {
      throw new ResourceNotFoundException('Parent Mandala', parentId);
    }
    if (!childMandala) {
      throw new ResourceNotFoundException('Child Mandala', childId);
    }

    try {
      const updatedParent = await this.mandalaRepository.unlinkMandala(
        parentId,
        childId,
      );

      await this.removeChildFromParentFirestore(parentId, childId);

      this.logger.log(
        `Mandala ${childId} successfully unlinked from parent ${parentId}`,
      );

      return updatedParent;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException({
        message: 'Failed to unlink mandalas',
        error: 'Unlink Operation Error',
        details: { parentId, childId, originalError: errorMessage },
      });
    }
  }

  async getCharacterList(projectId: string): Promise<CharacterListItemDto[]> {
    return this.mandalaRepository.findCharacterListByProject(projectId);
  }

  async generateQuestions(
    mandalaId: string,
    dimensions?: string[],
    scales?: string[],
  ): Promise<AiQuestionResponse[]> {
    this.logger.log(`generateQuestions called for mandala ${mandalaId}`);

    const mandala = await this.findOne(mandalaId);

    const { effectiveDimensions, effectiveScales } =
      getEffectiveDimensionsAndScales(mandala, dimensions, scales);

    const centerCharacter = mandala.configuration.center.name;
    const centerCharacterDescription = mandala.configuration.center.description;
    const tags = await this.projectService.getProjectTags(mandala.projectId);
    const mandalaDocument = await this.firebaseDataService.getDocument(
      mandala.projectId,
      mandalaId,
    );

    return this.aiService.generateQuestions(
      mandala.projectId,
      mandalaId,
      mandalaDocument as FirestoreMandalaDocument,
      effectiveDimensions,
      effectiveScales,
      tags.map((tag) => tag.name),
      centerCharacter,
      centerCharacterDescription || 'No content',
    );
  }

  async generatePostits(
    mandalaId: string,
    dimensions?: string[],
    scales?: string[],
  ): Promise<PostitWithCoordinates[]> {
    this.logger.log(`generatePostits called for mandala ${mandalaId}`);

    const mandala = await this.findOne(mandalaId);

    const { effectiveDimensions, effectiveScales } =
      getEffectiveDimensionsAndScales(mandala, dimensions, scales);

    return this.postitService.generatePostitsForMandala(
      mandalaId,
      effectiveDimensions,
      effectiveScales,
    );
  }

  async getFirestoreDocument(
    projectId: string,
    mandalaId: string,
  ): Promise<FirestoreMandalaDocument | null> {
    this.logger.log(`Getting Firestore document for mandala ${mandalaId}`);

    try {
      const document = await this.firebaseDataService.getDocument(
        projectId,
        mandalaId,
      );

      return document as FirestoreMandalaDocument | null;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to retrieve Firestore document for mandala ${mandalaId}: ${errorMessage}`,
      );
      throw new ExternalServiceException(
        'Firebase',
        'Failed to retrieve Firestore document',
        { mandalaId, originalError: errorMessage },
      );
    }
  }

  async overlapMandalas(
    overlapDto: OverlapMandalasDto,
  ): Promise<OverlapResultDto> {
    this.logger.log(
      `Starting overlap operation for ${overlapDto.mandalas.length} mandalas`,
    );

    try {
      const mandalas = await this.validateAndRetrieveMandalas(
        overlapDto.mandalas,
      );
      this.validateMandalaCompatibility(mandalas);

      // Extract all postits from source mandalas
      const allPostits = await Promise.all(
        mandalas.map(async (mandala) => {
          const document = (await this.firebaseDataService.getDocument(
            mandala.projectId,
            mandala.id,
          )) as FirestoreMandalaDocument | null;

          // Add metadata about which mandala each postit came from
          const postits = document?.postits || [];
          const postitsWithMetadata = postits.map((postit) => ({
            ...postit,
            from: {
              name: mandala.name,
              id: mandala.id,
            },
          }));

          this.logger.log(
            `Retrieved ${postitsWithMetadata.length} postits from mandala "${mandala.name}" (${mandala.id})`,
          );

          return postitsWithMetadata;
        }),
      );
      const flattenedPostits = allPostits.flat();

      // Extract all characters from source mandalas
      const allCharacters = await Promise.all(
        mandalas.map(async (mandala) => {
          const document = (await this.firebaseDataService.getDocument(
            mandala.projectId,
            mandala.id,
          )) as FirestoreMandalaDocument | null;

          const characters = document?.characters || [];
          const charactersWithMetadata = characters.map((character) => ({
            ...character,
            from: {
              name: mandala.name,
              id: mandala.id,
            },
          }));

          this.logger.log(
            `Retrieved ${charactersWithMetadata.length} characters from mandala "${mandala.name}" (${mandala.id})`,
          );

          return charactersWithMetadata;
        }),
      );
      const flattenedCharacters = allCharacters.flat();

      this.logger.log(`Total postits to overlap: ${flattenedPostits.length}`);
      this.logger.log(
        `Total characters to overlap: ${flattenedCharacters.length}`,
      );

      const overlappedConfiguration =
        this.overlapMandalaConfigurations(mandalas);

      this.logger.log(
        `Total centers to overlap: ${overlappedConfiguration.center.length}`,
      );

      const targetProjectId = getTargetProjectId(mandalas);

      // Create the overlapped mandala DTO with all centers
      const createOverlappedMandalaDto: CreateOverlappedMandalaDto = {
        name: overlapDto.name,
        projectId: targetProjectId,
        centers: overlappedConfiguration.center,
        dimensions: overlappedConfiguration.dimensions,
        scales: overlappedConfiguration.scales,
      };

      // Create the mandala with a composite center for database compatibility
      const createMandalaDto: CreateMandalaDto = {
        name: createOverlappedMandalaDto.name,
        projectId: createOverlappedMandalaDto.projectId,
        center: {
          name: `Centro Compuesto (${mandalas.length} personajes)`,
          description: `Combinación de personajes centrales de ${mandalas.length} mandalas`,
          color: calculateAverageColor(
            mandalas.map((m) => m.configuration.center.color),
          ),
        },
        dimensions: createOverlappedMandalaDto.dimensions,
        scales: createOverlappedMandalaDto.scales,
      };

      const newMandala = await this.create(createMandalaDto);

      await this.firebaseDataService.createDocument(
        targetProjectId,
        {
          mandala: newMandala,
          postits: flattenedPostits,
          characters: flattenedCharacters,
        },
        newMandala.id,
      );

      this.logger.log(
        `Successfully created overlapped mandala ${newMandala.id}`,
      );

      return {
        mandala: newMandala,
        centers: {
          centers: createOverlappedMandalaDto.centers,
        },
        mergedCount: mandalas.length,
        sourceMandalaIds: overlapDto.mandalas,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to overlap mandalas: ${errorMessage}`, error);
      throw new InternalServerErrorException({
        message: OVERLAP_ERROR_MESSAGES.OVERLAP_OPERATION_FAILED,
        error: OVERLAP_ERROR_TYPES.OVERLAP_OPERATION_ERROR,
        details: {
          mandalaIds: overlapDto.mandalas,
          originalError: errorMessage,
        },
      });
    }
  }

  /**
   * Validates and retrieves all mandalas for overlap operation
   * @param mandalaIds - Array of mandala IDs to validate and retrieve
   * @returns Array of validated MandalaDto objects
   * @throws BadRequestException if mandalas don't exist
   */
  private async validateAndRetrieveMandalas(
    mandalaIds: string[],
  ): Promise<MandalaDto[]> {
    // Validate that all mandalas exist
    const mandalas = await Promise.all(
      mandalaIds.map((id) => this.findOne(id)),
    );

    // Log project information for transparency
    const projectIds = [...new Set(mandalas.map((m) => m.projectId))];
    if (projectIds.length > 1) {
      this.logger.log(
        `Overlapping mandalas from ${projectIds.length} different projects: ${projectIds.join(', ')}. ` +
          `New mandala will be saved in project: ${projectIds[0]}`,
      );
    } else {
      this.logger.log(
        `All ${mandalas.length} mandalas belong to project: ${projectIds[0]}`,
      );
    }

    return mandalas;
  }

  /**
   * Validates that all mandalas have the same dimensions and scales
   * @param mandalas - Array of mandalas to validate
   * @throws BadRequestException if mandalas have different dimensions or scales
   */
  private validateMandalaCompatibility(mandalas: MandalaDto[]): void {
    validateSameDimensions(mandalas);
    validateSameScales(mandalas);

    const firstMandala = mandalas[0];
    const dimensions = firstMandala.configuration.dimensions.map((d) => d.name);
    const scales = firstMandala.configuration.scales;

    this.logger.log(
      `Validation successful: All ${mandalas.length} mandalas have matching dimensions [${dimensions.join(', ')}] and scales [${scales.join(', ')}]`,
    );
  }

  private overlapMandalaConfigurations(mandalas: MandalaDto[]): {
    center: CreateMandalaCenterDto[];
    dimensions: DimensionDto[];
    scales: string[];
  } {
    const allCenterCharacters = mandalas.map((m) => m.configuration.center);

    const firstMandala = mandalas[0];
    const dimensions = firstMandala.configuration.dimensions;
    const scales = firstMandala.configuration.scales;

    return {
      center: allCenterCharacters,
      dimensions: dimensions,
      scales: scales,
    };
  }
}
