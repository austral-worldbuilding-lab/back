import { DimensionDto } from '@common/dto/dimension.dto';
import {
  BadRequestException,
  ExternalServiceException,
  InternalServerErrorException,
  ResourceNotFoundException,
} from '@common/exceptions/custom-exceptions';
import { CacheService } from '@common/services/cache.service';
import { AppLogger } from '@common/services/logger.service';
import { PaginatedResponse } from '@common/types/responses';
import { AiService } from '@modules/ai/ai.service';
import { FirebaseDataService } from '@modules/firebase/firebase-data.service';
import { AiMandalaReport } from '@modules/mandala/types/ai-report';
import { PostitWithCoordinates } from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions.type';
import { ProjectService } from '@modules/project/project.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import {
  FirestoreCharacter,
  FirestoreMandalaDocument,
} from '../firebase/types/firestore-character.type';

import {
  OVERLAP_ERROR_MESSAGES,
  OVERLAP_ERROR_TYPES,
} from './constants/overlap-error-messages';
import { CharacterListItemDto } from './dto/character-list-item.dto';
import {
  CreateMandalaCenterDto,
  CreateMandalaCenterWithOriginDto,
  CreateMandalaDto,
  CreateOverlappedMandalaDto,
} from './dto/create-mandala.dto';
import { FilterSectionDto } from './dto/filter-option.dto';
import { MandalaWithPostitsAndLinkedCentersDto } from './dto/mandala-with-postits-and-linked-centers.dto';
import { hasCharacters, MandalaDto } from './dto/mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { MandalaRepository } from './mandala.repository';
import { PostitService } from './services/postit.service';
import { MandalaType } from './types/mandala-type.enum';
import { getEffectiveDimensionsAndScales } from './utils/mandala-config.util';
import {
  getTargetProjectId,
  validateSameDimensions,
  validateSameScales,
} from './utils/overlap-validation.utils';

const DEFAULT_CHARACTER_POSITION = { x: 0, y: 0 };
const DEFAULT_CHARACTER_SECTION = '';
const DEFAULT_CHARACTER_DIMENSION = '';

@Injectable()
export class MandalaService {
  constructor(
    private mandalaRepository: MandalaRepository,
    private firebaseDataService: FirebaseDataService,
    private postitService: PostitService,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
    private aiService: AiService,
    private cacheService: CacheService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MandalaService.name);
  }

  private async completeMissingConfiguration(
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

  async create(
    createMandalaDto: CreateMandalaDto,
    type: MandalaType,
  ): Promise<MandalaDto> {
    const completeDto: CreateMandalaDto =
      await this.completeMissingConfiguration(createMandalaDto);
    const mandala: MandalaDto = await this.mandalaRepository.create(
      completeDto,
      type,
    );

    try {
      const childrenCenter = (
        await this.mandalaRepository.findChildrenMandalasCenters(mandala.id)
      ).map((center) => ({
        id: center.id,
        name: center.name,
        description: center.description,
        color: center.color,
        position: DEFAULT_CHARACTER_POSITION,
        section: DEFAULT_CHARACTER_SECTION,
        dimension: DEFAULT_CHARACTER_DIMENSION,
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
        await this.updateParentMandalaDocument(parentId, mandala.id);
        this.logger.log(
          `Parent mandala ${parentId} document updated for mandala ${mandala.id}`,
        );
      }
    }

    return mandala;
  }

  async findAll(projectId: string): Promise<MandalaDto[]> {
    return this.mandalaRepository.findAll(projectId);
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

  async updateParentMandalaDocument(
    parentMandalaId: string,
    newChildId?: string,
  ): Promise<void> {
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

      const childrenCenterMap = new Map(
        childrenCenter.map((center) => [center.id, center]),
      );

      const childrenIds = new Set(childrenCenter.map((center) => center.id));
      const updatedCharacters: FirestoreCharacter[] = [];

      existingCharacters.forEach((existingChar) => {
        if (childrenIds.has(existingChar.id)) {
          const centerData = childrenCenterMap.get(existingChar.id);
          if (centerData) {
            updatedCharacters.push({
              ...existingChar,
              name: centerData.name,
              description: centerData.description,
              color: centerData.color,
            });
          }
        }
      });

      // Add only the specific new character if provided (when linking)
      if (newChildId) {
        const newCenter = childrenCenterMap.get(newChildId);
        if (newCenter && !existingCharactersMap.has(newChildId)) {
          updatedCharacters.push({
            id: newCenter.id,
            name: newCenter.name,
            description: newCenter.description,
            color: newCenter.color,
            position: DEFAULT_CHARACTER_POSITION,
            section: DEFAULT_CHARACTER_SECTION,
            dimension: DEFAULT_CHARACTER_DIMENSION,
          });
        }
      }

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

    const mandala: MandalaDto = await this.create(
      createMandalaDto,
      createMandalaDto.type || MandalaType.CHARACTER,
    );

    try {
      const postits = await this.postitService.generatePostits(
        mandala,
        mandala.configuration.dimensions.map((d) => d.name),
        mandala.configuration.scales,
        createMandalaDto.selectedFiles,
      );
      this.logger.debug('postits', postits);
      const postitsWithCoordinates: PostitWithCoordinates[] =
        this.postitService.transformToPostitsWithCoordinates(
          mandala.id,
          postits,
          mandala.configuration.dimensions.map((d) => d.name),
          mandala.configuration.scales,
        );

      const childrenCenter = (
        await this.mandalaRepository.findChildrenMandalasCenters(mandala.id)
      ).map((center) => ({
        name: center.name,
        description: center.description,
        color: center.color,
        position: DEFAULT_CHARACTER_POSITION,
        section: DEFAULT_CHARACTER_SECTION,
        dimension: DEFAULT_CHARACTER_DIMENSION,
      }));

      const firestoreData: MandalaWithPostitsAndLinkedCentersDto = {
        mandala: mandala,
        postits: postitsWithCoordinates,
        childrenCenter,
      };

      await this.firebaseDataService.createDocument(
        createMandalaDto.projectId,
        {
          mandala: mandala,
          postits: postitsWithCoordinates,
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

    if (hasCharacters(mandala)) {
      if (mandala.characters.length > 0) {
        filterSections.push({
          sectionName: 'Personajes',
          type: 'multiple',
          options: mandala.characters.map((character) => ({
            label: character.name,
            color: character.color,
          })),
        });
      } else {
        // Fallback: buscar en mandalas hijas vinculadas manualmente
        const childrenCenter =
          await this.mandalaRepository.findChildrenMandalasCenters(mandalaId);

        if (childrenCenter && childrenCenter.length > 0) {
          filterSections.push({
            sectionName: 'Personajes',
            type: 'multiple',
            options: childrenCenter.map((center) => ({
              label: center.name,
              color: center.color,
            })),
          });
        }
      }
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

      await this.updateParentMandalaDocument(parentId, childId);

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
    userId: string,
    mandalaId: string,
    dimensions?: string[],
    scales?: string[],
    selectedFiles?: string[],
  ): Promise<AiQuestionResponse[]> {
    this.logger.log(`generateQuestions called for mandala ${mandalaId}`);

    const mandala = await this.findOne(mandalaId);
    const { effectiveDimensions, effectiveScales } =
      getEffectiveDimensionsAndScales(mandala, dimensions, scales);

    const questions = await this.generateQuestionsFromAI(
      mandala,
      effectiveDimensions,
      effectiveScales,
      selectedFiles,
    );

    await this.saveQuestionsToCache(userId, mandalaId, questions);

    return questions;
  }

  private async saveQuestionsToCache(
    userId: string,
    mandalaId: string,
    questions: AiQuestionResponse[],
  ): Promise<void> {
    const cacheKey = this.cacheService.buildCacheKey(
      'questions',
      userId,
      mandalaId,
    );

    for (const question of questions) {
      await this.cacheService.addToLimitedCache(cacheKey, question, 20);
    }
    this.logger.log(
      `Saved questions to cache for user ${userId}, mandala ${mandalaId}`,
    );
  }

  private async generateQuestionsFromAI(
    mandala: MandalaDto,
    effectiveDimensions: string[],
    effectiveScales: string[],
    selectedFiles?: string[],
  ): Promise<AiQuestionResponse[]> {
    const centerCharacter = mandala.configuration.center.name;
    const centerCharacterDescription = mandala.configuration.center.description;
    const tags = await this.projectService.getProjectTags(mandala.projectId);
    const mandalaDocument = await this.firebaseDataService.getDocument(
      mandala.projectId,
      mandala.id,
    );

    // Get project information
    const project = await this.projectService.findOne(mandala.projectId);

    return this.aiService.generateQuestions(
      mandala.projectId,
      project.name,
      project.description || '',
      mandala.id,
      mandalaDocument as FirestoreMandalaDocument,
      effectiveDimensions,
      effectiveScales,
      tags.map((tag) => tag.name),
      centerCharacter,
      centerCharacterDescription || 'No content',
      selectedFiles,
    );
  }

  async generatePostits(
    userId: string,
    mandalaId: string,
    dimensions?: string[],
    scales?: string[],
    selectedFiles?: string[],
  ): Promise<PostitWithCoordinates[]> {
    this.logger.log(`generatePostits called for mandala ${mandalaId}`);

    const mandala = await this.findOne(mandalaId);
    const { effectiveDimensions, effectiveScales } =
      getEffectiveDimensionsAndScales(mandala, dimensions, scales);

    const postits = await this.generatePostitsFromAI(
      mandala,
      effectiveDimensions,
      effectiveScales,
      selectedFiles,
    );

    await this.savePostitsToCache(userId, mandalaId, postits);

    return postits;
  }

  private async savePostitsToCache(
    userId: string,
    mandalaId: string,
    postits: PostitWithCoordinates[],
  ): Promise<void> {
    const cacheKey = this.cacheService.buildCacheKey(
      'postits',
      userId,
      mandalaId,
    );

    for (const postit of postits) {
      await this.cacheService.addToLimitedCache(cacheKey, postit, 20);
    }
    this.logger.log(
      `Saved ${postits.length} postits to cache for user ${userId}, mandala ${mandalaId}`,
    );
  }

  async getCachedQuestions(
    userId: string,
    mandalaId: string,
  ): Promise<AiQuestionResponse[]> {
    const cacheKey = this.cacheService.buildCacheKey(
      'questions',
      userId,
      mandalaId,
    );
    return this.cacheService.getFromCache<AiQuestionResponse>(cacheKey);
  }

  async getCachedPostits(
    userId: string,
    mandalaId: string,
  ): Promise<PostitWithCoordinates[]> {
    const cacheKey = this.cacheService.buildCacheKey(
      'postits',
      userId,
      mandalaId,
    );
    return this.cacheService.getFromCache<PostitWithCoordinates>(cacheKey);
  }

  private async generatePostitsFromAI(
    mandala: MandalaDto,
    effectiveDimensions: string[],
    effectiveScales: string[],
    selectedFiles?: string[],
  ): Promise<PostitWithCoordinates[]> {
    const postits = await this.postitService.generatePostits(
      mandala,
      effectiveDimensions,
      effectiveScales,
      selectedFiles,
    );

    return this.postitService.transformToPostitsWithCoordinates(
      mandala.id,
      postits,
      effectiveDimensions,
      effectiveScales,
    );
  }

  async getFirestoreDocument(
    projectId: string,
    mandalaId: string,
  ): Promise<FirestoreMandalaDocument> {
    this.logger.log(`Getting Firestore document for mandala ${mandalaId}`);

    try {
      const document = await this.firebaseDataService.getDocument(
        projectId,
        mandalaId,
      );

      return document as FirestoreMandalaDocument;
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

  async createOverlapMandala(
    createOverlapDto: CreateOverlappedMandalaDto,
  ): Promise<MandalaDto> {
    this.logger.log(
      `Starting overlap operation for ${createOverlapDto.mandalas.length} mandalas`,
    );

    try {
      const mandalas = await this.validateAndRetrieveMandalas(
        createOverlapDto.mandalas,
      );
      this.validateMandalaCompatibility(mandalas);

      const flattenedPostits =
        await this.postitService.collectPostitsWithSource(mandalas);

      this.logger.log(`Total postits to overlap: ${flattenedPostits.length}`);

      const overlappedConfiguration =
        this.overlapMandalaConfigurations(mandalas);

      const allCenterCharacters: CreateMandalaCenterWithOriginDto[] =
        mandalas.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.configuration.center.description,
          color: m.configuration.center.color,
        }));

      this.logger.log(
        `Total centers to overlap: ${allCenterCharacters.length}`,
      );

      const targetProjectId = getTargetProjectId(mandalas);

      const overlapCenter: CreateMandalaCenterDto = {
        name: createOverlapDto.name,
        description: `Mandala unificada: ${allCenterCharacters
          .map((c) => c.name)
          .join(', ')}`,
        color: createOverlapDto.color,
        characters: allCenterCharacters,
      };

      const createOverlappedMandalaDto: CreateMandalaDto = {
        name: createOverlapDto.name,
        projectId: targetProjectId,
        center: overlapCenter,
        dimensions: overlappedConfiguration.dimensions,
        scales: overlappedConfiguration.scales,
      };

      const newMandala = await this.create(
        createOverlappedMandalaDto,
        MandalaType.OVERLAP,
      );

      await this.firebaseDataService.updateDocument(
        targetProjectId,
        {
          postits: flattenedPostits,
        },
        newMandala.id,
      );

      this.logger.log(
        `Successfully created overlapped mandala ${newMandala.id}`,
      );

      return newMandala;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to overlap mandalas: ${errorMessage}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException({
        message: OVERLAP_ERROR_MESSAGES.OVERLAP_OPERATION_FAILED,
        error: OVERLAP_ERROR_TYPES.OVERLAP_OPERATION_ERROR,
        details: {
          mandalaIds: createOverlapDto.mandalas,
          originalError: errorMessage,
        },
      });
    }
  }

  async createOverlapSummary(
    createOverlapDto: CreateOverlappedMandalaDto,
  ): Promise<{ mandala: MandalaDto; summaryReport: AiMandalaReport }> {
    this.logger.log(
      `Starting overlap summary operation for ${createOverlapDto.mandalas.length} mandalas`,
    );
    try {
      const mandalas = await this.validateAndRetrieveMandalas(
        createOverlapDto.mandalas,
      );
      this.validateMandalaCompatibility(mandalas);

      const overlappedConfiguration =
        this.overlapMandalaConfigurations(mandalas);

      const allCenterCharacters: CreateMandalaCenterWithOriginDto[] =
        mandalas.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.configuration.center.description,
          color: m.configuration.center.color,
        }));

      this.logger.log(
        `Total centers to overlap: ${allCenterCharacters.length}`,
      );

      const targetProjectId = getTargetProjectId(mandalas);

      const overlapCenter: CreateMandalaCenterDto = {
        name: createOverlapDto.name,
        description: `Mandala unificada: ${allCenterCharacters
          .map((c) => c.name)
          .join(', ')}`,
        color: createOverlapDto.color,
        characters: allCenterCharacters,
      };

      const createOverlappedMandalaDto: CreateMandalaDto = {
        name: createOverlapDto.name,
        projectId: targetProjectId,
        center: overlapCenter,
        dimensions: overlappedConfiguration.dimensions,
        scales: overlappedConfiguration.scales,
      };

      const mandalasDocument = await Promise.all(
        mandalas.map((m) => this.getFirestoreDocument(m.projectId, m.id)),
      );

      const newMandala = await this.create(
        createOverlappedMandalaDto,
        MandalaType.OVERLAP_SUMMARY,
      );

      const { comparisons, report } =
        await this.postitService.generateComparisonPostits(
          mandalas,
          mandalasDocument,
        );

      if (!report) {
        throw new InternalServerErrorException({
          message: 'AI service failed to generate a report',
          error: 'AI Report Generation Error',
          details: { mandalaId: newMandala.id },
        });
      }

      const aiSummaryPostitsWithCoordinates =
        this.postitService.transformToPostitsWithCoordinates(
          newMandala.id,
          comparisons,
          overlappedConfiguration.dimensions.map((d) => d.name),
          overlappedConfiguration.scales,
        );

      await this.firebaseDataService.upsertDocument(
        targetProjectId,
        {
          postits: aiSummaryPostitsWithCoordinates,
          summaryReport: report,
        },
        newMandala.id,
      );

      this.logger.log(
        `Successfully created overlapped mandala ${newMandala.id}`,
      );

      return { mandala: newMandala, summaryReport: report };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to overlap mandalas: ${errorMessage}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException({
        message: OVERLAP_ERROR_MESSAGES.OVERLAP_OPERATION_FAILED,
        error: OVERLAP_ERROR_TYPES.OVERLAP_OPERATION_ERROR,
        details: {
          mandalaIds: createOverlapDto.mandalas,
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
    dimensions: DimensionDto[];
    scales: string[];
  } {
    const firstMandala = mandalas[0];
    const dimensions = firstMandala.configuration.dimensions;
    const scales = firstMandala.configuration.scales;

    return {
      dimensions: dimensions,
      scales: scales,
    };
  }

  async countPostitsAcrossMandalas(mandalas: MandalaDto[]): Promise<number> {
    const mandalasDocument = await Promise.all(
      mandalas.map((mandala) =>
        this.getFirestoreDocument(mandala.projectId, mandala.id),
      ),
    );

    return mandalasDocument.reduce((acc, doc) => {
      const postits = doc.postits || [];
      return acc + postits.length;
    }, 0);
  }

  async generateSummaryReport(
    mandalaId: string,
  ): Promise<{ summaryReport: string }> {
    const mandala = await this.findOne(mandalaId);
    if (!mandala) {
      throw new ResourceNotFoundException('Mandala', mandalaId);
    }

    const mandalaDoc = await this.firebaseDataService.getDocument(
      mandala.projectId,
      mandalaId,
    );

    if (!mandalaDoc) {
      throw new ResourceNotFoundException('MandalaDocument', mandalaId);
    }

    // Generar resumen con IA
    const summaryReport = await this.aiService.generateMandalaSummary(
      mandala.projectId,
      mandala,
      mandalaDoc as FirestoreMandalaDocument,
    );

    // Guardar resumen en Firestore
    await this.firebaseDataService.updateDocument(
      mandala.projectId,
      { summaryReport },
      mandalaId,
    );

    return { summaryReport };
  }

  getAllMandalaSummariesWithAi(
    projectId: string,
    mandalaDocs: FirestoreMandalaDocument[],
    mandalas: MandalaDto[],
  ): string {
    this.logger.log(
      `Getting all AI-generated summaries for project ${projectId}`,
    );

    const summaries: string[] = [];

    for (let i = 0; i < mandalaDocs.length; i++) {
      const doc = mandalaDocs[i];
      const mandala = mandalas[i];

      let summary = '';

      if (mandala.type === MandalaType.OVERLAP_SUMMARY) {
        // Para OVERLAP_SUMMARY, usar el report directamente (no generar nuevo resumen)
        if (doc.summaryReport) {
          try {
            const reportData = JSON.parse(doc.summaryReport) as {
              summary?: string;
            };
            summary = reportData.summary || doc.summaryReport;
          } catch {
            summary = doc.summaryReport;
          }
        }
      } else {
        summary = doc.summaryReport || '';
      }

      if (summary) {
        summaries.push(summary);
      }
    }

    this.logger.log(
      `Found ${summaries.length} summaries with AI content (including ${mandalas.filter((m) => m.type === MandalaType.OVERLAP_SUMMARY).length} OVERLAP_SUMMARY reports)`,
    );

    return summaries.join('\n\n');
  }
}
