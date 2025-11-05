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
import { UploadContextDto } from '@modules/files/dto/upload-context.dto';
import { TextStorageService } from '@modules/files/services/text-storage.service';
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
import { NotificationService } from '../notification/notification.service';
import { Notification } from '../notification/types/notification';
import { OrganizationService } from '../organization/organization.service';

import {
  OVERLAP_ERROR_MESSAGES,
  OVERLAP_ERROR_TYPES,
} from './constants/overlap-error-messages';
import { AiMandalaImageResponseDto } from './dto/ai-mandala-image-response.dto';
import { CharacterListItemDto } from './dto/character-list-item.dto';
import {
  CreateMandalaCenterDto,
  CreateMandalaCenterWithOriginDto,
  CreateMandalaDto,
  CreateOverlappedMandalaDto,
  CreateContextMandalaDto,
} from './dto/create-mandala.dto';
import { FilterSectionDto } from './dto/filter-option.dto';
import { MandalaWithPostitsAndLinkedCentersDto } from './dto/mandala-with-postits-and-linked-centers.dto';
import { hasCharacters, MandalaDto } from './dto/mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { MandalaRepository } from './mandala.repository';
import { ImageService } from './services/image.service';
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
    private imageService: ImageService,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
    private aiService: AiService,
    private cacheService: CacheService,
    private readonly logger: AppLogger,
    private notificationService: NotificationService,
    private organizationService: OrganizationService,
    private textStorageService: TextStorageService,
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
    userId: string,
  ): Promise<MandalaDto> {
    if (!createMandalaDto.projectId) {
      throw new BadRequestException(
        'Project ID is required to generate mandala',
      );
    }

    const mandala: MandalaDto = await this.create(
      createMandalaDto,
      MandalaType.CHARACTER,
    );

    const notification: Notification = {
      title: 'Generación en Proceso',
      content: `La mandala ${createMandalaDto.name} está siendo generada con IA`,
      createdAt: new Date(),
    };

    void this.notificationService.sendNotification(userId, notification);
    void this.generatePipeline(mandala, createMandalaDto, userId);
    return mandala;
  }

  private async generatePipeline(
    mandala: MandalaDto,
    createMandalaDto: CreateMandalaDto,
    userId: string,
  ) {
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

      const organization =
        await this.organizationService.findOrganizationIdByProjectId(
          createMandalaDto.projectId,
        );

      const notification: Notification = {
        title: 'Mandala Generada',
        content: `La mandala ${createMandalaDto.name} ha sido generada correctamente`,
        createdAt: new Date(),
        url: `/app/organization/${organization}/projects/${createMandalaDto.projectId}/mandala/${mandala.id}`,
      };

      void this.notificationService.sendNotification(userId, notification);

      return firestoreData;
    } catch (error) {
      await this.remove(mandala.id);
      const notification: Notification = {
        title: 'Error en la Generación',
        content: `Ha ocurrido un error durante la generación de la mandala ${createMandalaDto.name}. Por favor, vuelva a intentarlo.`,
        createdAt: new Date(),
      };
      void this.notificationService.sendNotification(userId, notification);
      throw error;
    }
  }

  async generateContext(
    createContextDto: CreateContextMandalaDto,
    userId: string,
  ): Promise<MandalaDto> {
    if (!createContextDto.projectId) {
      throw new BadRequestException(
        'Project ID is required to generate context mandala',
      );
    }

    const mandala: MandalaDto = await this.create(
      createContextDto,
      MandalaType.CONTEXT,
    );

    const notification: Notification = {
      title: 'Generación en Proceso',
      content: `La mandala ${createContextDto.name} está siendo generada con IA`,
      createdAt: new Date(),
    };

    void this.notificationService.sendNotification(userId, notification);
    void this.generatePipeline(mandala, createContextDto, userId);
    return mandala;
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

  async generateMandalaImages(
    userId: string,
    mandalaId: string,
    dimensions?: string[],
    scales?: string[],
  ): Promise<AiMandalaImageResponseDto[]> {
    this.logger.log(
      `generateMandalaImages called for mandala ${mandalaId} by user ${userId}`,
    );

    const mandala = await this.findOne(mandalaId);
    const { effectiveDimensions, effectiveScales } =
      getEffectiveDimensionsAndScales(mandala, dimensions, scales);

    const aiImages = await this.generateMandalaImagesFromAI(
      mandala,
      effectiveDimensions,
      effectiveScales,
    );

    // Save images to blob storage inside mandala/cached folder
    const savedImages = await this.imageService.saveAiGeneratedImages(
      mandala.projectId,
      mandalaId,
      aiImages,
    );

    this.logger.log(
      `Saved ${savedImages.length} AI-generated images to blob storage for mandala ${mandalaId}`,
    );

    // Return as DTOs with url
    return savedImages as AiMandalaImageResponseDto[];
  }

  private async generateMandalaImagesFromAI(
    mandala: MandalaDto,
    effectiveDimensions: string[],
    effectiveScales: string[],
  ): Promise<Array<{ id: string; imageData: string }>> {
    const centerName = mandala.configuration.center.name;
    const centerDescription = mandala.configuration.center.description || 'N/A';
    const mandalaDocument = await this.firebaseDataService.getDocument(
      mandala.projectId,
      mandala.id,
    );

    // Get project information
    const project = await this.projectService.findOne(mandala.projectId);

    const mandalaDocumentString = JSON.stringify(mandalaDocument);

    return this.aiService.generateMandalaImages(
      mandala.projectId,
      mandala.id,
      project.name,
      project.description || '',
      effectiveDimensions,
      effectiveScales,
      centerName,
      centerDescription,
      mandalaDocumentString,
    );
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

  async hasSummary(mandalaId: string): Promise<boolean> {
    const mandala = await this.findOne(mandalaId);
    if (!mandala) {
      throw new ResourceNotFoundException('Mandala', mandalaId);
    }

    try {
      const mandalaDoc = await this.firebaseDataService.getDocument(
        mandala.projectId,
        mandalaId,
      );

      if (!mandalaDoc) {
        return false;
      }

      const doc = mandalaDoc as FirestoreMandalaDocument;

      return !!doc.summaryReport;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to check summary existence for mandala ${mandalaId}: ${errorMessage}`,
      );
      return false;
    }
  }

  /**
   * Gets all mandalas with their summary status for a project
   * @param projectId - The project ID
   * @returns Array of objects with mandala and hasSummary flag
   */
  async getMandalasWithSummaryStatus(
    projectId: string,
  ): Promise<Array<{ mandala: MandalaDto; hasSummary: boolean }>> {
    this.logger.log(
      `Getting mandalas with summary status for project ${projectId}`,
    );

    try {
      const allMandalas = await this.findAll(projectId);

      const mandalaChecks = await Promise.all(
        allMandalas.map(async (mandala) => {
          try {
            const hasSummary = await this.hasSummary(mandala.id);
            return { mandala, hasSummary };
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(
              `Failed to check summary for mandala ${mandala.id}: ${errorMessage}`,
            );
            return { mandala, hasSummary: false };
          }
        }),
      );

      const withSummaryCount = mandalaChecks.filter(
        ({ hasSummary }) => hasSummary,
      ).length;

      this.logger.log(
        `Found ${withSummaryCount} mandalas with summaries and ${allMandalas.length - withSummaryCount} without summaries in project ${projectId}`,
      );

      return mandalaChecks;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get mandalas with summary status for project ${projectId}: ${errorMessage}`,
      );
      throw new InternalServerErrorException({
        message: 'Failed to retrieve mandalas with summary status',
        error: 'Project Summary Query Error',
        details: { projectId, originalError: errorMessage },
      });
    }
  }

  /**
   * Gets only mandalas that have summaries for a project
   * @param projectId - The project ID
   * @returns Array of mandalas with summaries
   */
  async getMandalasWithSummary(projectId: string): Promise<MandalaDto[]> {
    const mandalaChecks = await this.getMandalasWithSummaryStatus(projectId);

    return mandalaChecks
      .filter(({ hasSummary }) => hasSummary)
      .map(({ mandala }) => mandala);
  }

  async getMandalaSummary(mandalaId: string): Promise<string> {
    const mandala = await this.findOne(mandalaId);
    if (!mandala) {
      throw new ResourceNotFoundException('Mandala', mandalaId);
    }

    try {
      const mandalaDoc = await this.firebaseDataService.getDocument(
        mandala.projectId,
        mandalaId,
      );

      if (!mandalaDoc) {
        throw new ResourceNotFoundException('MandalaDocument', mandalaId);
      }

      const doc = mandalaDoc as FirestoreMandalaDocument;

      if (!doc.summaryReport) {
        throw new ResourceNotFoundException('Summary', mandalaId);
      }

      return this.extractSummaryFromDocument(doc, mandala);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get summary for mandala ${mandalaId}: ${errorMessage}`,
      );

      if (error instanceof ResourceNotFoundException) {
        throw error;
      }

      throw new ExternalServiceException(
        'Firebase',
        'Failed to retrieve mandala summary',
        { mandalaId, originalError: errorMessage },
      );
    }
  }

  /**
   * Extracts the summary from a mandala document based on mandala type
   * @private
   */
  private extractSummaryFromDocument(
    doc: FirestoreMandalaDocument,
    mandala: MandalaDto,
  ): string {
    if (!doc.summaryReport) {
      return '';
    }

    if (mandala.type === MandalaType.OVERLAP_SUMMARY) {
      try {
        const reportData = JSON.parse(doc.summaryReport) as {
          summary?: string;
        };
        return reportData.summary || doc.summaryReport;
      } catch {
        return doc.summaryReport;
      }
    }

    return doc.summaryReport;
  }

  /**
   * Gets all mandala summaries for a project and joins them into a single string
   * Functional version that works directly with projectId
   * @param projectId - The project ID
   * @returns String with all summaries joined by '\n\n'
   */
  async getAllMandalaSummariesByProjectId(projectId: string): Promise<string> {
    this.logger.log(
      `Getting all AI-generated summaries for project ${projectId}`,
    );

    try {
      // Get only mandalas that have summaries
      const mandalasWithSummary = await this.getMandalasWithSummary(projectId);

      if (mandalasWithSummary.length === 0) {
        this.logger.log(
          `No mandalas with summaries found for project ${projectId}`,
        );
        return '';
      }

      // Fetch all documents in parallel
      const mandalaDocs = await Promise.all(
        mandalasWithSummary.map((mandala) =>
          this.getFirestoreDocument(mandala.projectId, mandala.id),
        ),
      );

      // Extract and join summaries functionally
      const summaries = mandalaDocs
        .map((doc, index) =>
          this.extractSummaryFromDocument(doc, mandalasWithSummary[index]),
        )
        .filter((summary) => summary !== '');

      const overlapSummaryCount = mandalasWithSummary.filter(
        (m) => m.type === MandalaType.OVERLAP_SUMMARY,
      ).length;

      this.logger.log(
        `Found ${summaries.length} summaries with AI content (including ${overlapSummaryCount} OVERLAP_SUMMARY reports)`,
      );

      return summaries.join('\n\n');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get all summaries for project ${projectId}: ${errorMessage}`,
      );
      throw new InternalServerErrorException({
        message: 'Failed to retrieve all mandala summaries',
        error: 'Project Summary Retrieval Error',
        details: { projectId, originalError: errorMessage },
      });
    }
  }

  /**
   * Gets all mandala summaries given pre-fetched documents and mandalas
   * Legacy method kept for backwards compatibility
   * @param projectId - The project ID
   * @param mandalaDocs - Pre-fetched Firestore documents
   * @param mandalas - Pre-fetched mandala DTOs
   * @returns String with all summaries joined by '\n\n'
   */
  getAllMandalaSummaries(
    projectId: string,
    mandalaDocs: FirestoreMandalaDocument[],
    mandalas: MandalaDto[],
  ): string {
    this.logger.log(
      `Getting all AI-generated summaries for project ${projectId}`,
    );

    // Combine docs and mandalas into tuples and extract summaries
    const summaries = mandalaDocs
      .map((doc, index) => ({
        doc,
        mandala: mandalas[index],
      }))
      .map(({ doc, mandala }) => this.extractSummaryFromDocument(doc, mandala))
      .filter((summary) => summary !== '');

    const overlapSummaryCount = mandalas.filter(
      (m) => m.type === MandalaType.OVERLAP_SUMMARY,
    ).length;

    this.logger.log(
      `Found ${summaries.length} summaries with AI content (including ${overlapSummaryCount} OVERLAP_SUMMARY reports)`,
    );

    return summaries.join('\n\n');
  }

  async uploadTextFile(
    mandalaId: string,
    uploadContext: UploadContextDto,
  ): Promise<string> {
    const mandala = await this.findOne(mandalaId);
    const project = await this.projectService.findOne(mandala.projectId);

    const scope = {
      orgId: project.organizationId,
      projectId: mandala.projectId,
      mandalaId,
    };

    return this.textStorageService.uploadText(
      uploadContext.content,
      uploadContext.filename,
      scope,
    );
  }
}
