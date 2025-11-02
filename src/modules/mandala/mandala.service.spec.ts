import { InternalServerErrorException } from '@common/exceptions/custom-exceptions';
import { CacheService } from '@common/services/cache.service';
import { AppLogger } from '@common/services/logger.service';
import { AiService } from '@modules/ai/ai.service';
import { FirebaseDataService } from '@modules/firebase/firebase-data.service';
import {
  OVERLAP_ERROR_MESSAGES,
  OVERLAP_ERROR_TYPES,
} from '@modules/mandala/constants/overlap-error-messages';
import { CreateOverlappedMandalaDto } from '@modules/mandala/dto/create-mandala.dto';
import { MandalaDto } from '@modules/mandala/dto/mandala.dto';
import { MandalaRepository } from '@modules/mandala/mandala.repository';
import { MandalaService } from '@modules/mandala/mandala.service';
import { ImageService } from '@modules/mandala/services/image.service';
import { PostitService } from '@modules/mandala/services/postit.service';
import { AiMandalaReport } from '@modules/mandala/types/ai-report';
import { MandalaType } from '@modules/mandala/types/mandala-type.enum';
import { PostitComparison } from '@modules/mandala/types/postits';
import { NotificationService } from '@modules/notification/notification.service';
import { OrganizationService } from '@modules/organization/organization.service';
import { ProjectService } from '@modules/project/project.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('MandalaService - createOverlapSummary cleanup', () => {
  let service: MandalaService;
  let mandalaRepository: jest.Mocked<MandalaRepository>;
  let firebaseDataService: jest.Mocked<FirebaseDataService>;
  let postitService: jest.Mocked<PostitService>;
  let logger: jest.Mocked<AppLogger>;

  const mockMandalaDto: MandalaDto = {
    id: 'mandala-1',
    name: 'Test Mandala',
    projectId: 'project-1',
    type: MandalaType.CHARACTER,
    configuration: {
      center: {
        name: 'Test Center',
        description: 'Test Description',
        color: '#000000',
      },
      dimensions: [{ name: 'Dimension 1', color: '#FF0000' }],
      scales: ['Scale 1', 'Scale 2'],
    },
    parentIds: [],
    childrenIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOverlapMandalaDto: MandalaDto = {
    ...mockMandalaDto,
    id: 'overlap-mandala-1',
    name: 'Overlap Mandala',
    type: MandalaType.OVERLAP_SUMMARY,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MandalaService,
        {
          provide: MandalaRepository,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            findChildrenMandalasCenters: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: FirebaseDataService,
          useValue: {
            createDocument: jest.fn(),
            getDocument: jest.fn(),
            upsertDocument: jest.fn(),
            deleteDocument: jest.fn(),
          },
        },
        {
          provide: PostitService,
          useValue: {
            generateComparisonPostits: jest.fn(),
            transformToPostitsWithCoordinates: jest.fn(),
          },
        },
        {
          provide: ImageService,
          useValue: {},
        },
        {
          provide: ProjectService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {},
        },
        {
          provide: CacheService,
          useValue: {},
        },
        {
          provide: AppLogger,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {},
        },
        {
          provide: OrganizationService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MandalaService>(MandalaService);
    mandalaRepository = module.get(MandalaRepository);
    firebaseDataService = module.get(FirebaseDataService);
    postitService = module.get(PostitService);
    logger = module.get(AppLogger);
  });

  describe('createOverlapSummary - error handling and cleanup', () => {
    const createOverlapDto: CreateOverlappedMandalaDto = {
      name: 'Test Overlap Summary',
      color: '#0000FF',
      mandalas: ['mandala-1', 'mandala-2'],
    };

    beforeEach(() => {
      // Setup common mocks
      mandalaRepository.findOne.mockResolvedValue(mockMandalaDto);
      firebaseDataService.createDocument.mockResolvedValue(undefined);
    });

    it('should remove mandala from database and Firestore when AI comparison postits generation fails', async () => {
      // Arrange
      mandalaRepository.create.mockResolvedValue(mockOverlapMandalaDto);
      firebaseDataService.getDocument.mockResolvedValue({
        mandala: mockMandalaDto,
        postits: [],
        characters: [],
      });

      // Simulate AI service failure
      postitService.generateComparisonPostits.mockRejectedValue(
        new Error('AI service connection failed'),
      );

      const removeSpy = jest
        .spyOn(service, 'remove')
        .mockResolvedValue(mockOverlapMandalaDto);

      // Act & Assert
      await expect(
        service.createOverlapSummary(createOverlapDto),
      ).rejects.toThrow(InternalServerErrorException);

      // Verify cleanup was called
      expect(removeSpy).toHaveBeenCalledWith('overlap-mandala-1');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Removing mandala overlap-mandala-1 due to error',
        ),
      );
    });

    it('should remove mandala when AI report generation returns null', async () => {
      // Arrange
      mandalaRepository.create.mockResolvedValue(mockOverlapMandalaDto);
      firebaseDataService.getDocument.mockResolvedValue({
        mandala: mockMandalaDto,
        postits: [],
        characters: [],
      });

      // Simulate AI service returning no report
      postitService.generateComparisonPostits.mockResolvedValue({
        comparisons: [],
        report: null as any,
      });

      const removeSpy = jest
        .spyOn(service, 'remove')
        .mockResolvedValue(mockOverlapMandalaDto);

      // Act & Assert
      await expect(
        service.createOverlapSummary(createOverlapDto),
      ).rejects.toThrow(InternalServerErrorException);

      // Verify cleanup was called
      expect(removeSpy).toHaveBeenCalledWith('overlap-mandala-1');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Removing mandala overlap-mandala-1 due to error',
        ),
      );
    });

    it('should remove mandala when Firestore upsert fails', async () => {
      // Arrange
      mandalaRepository.create.mockResolvedValue(mockOverlapMandalaDto);
      firebaseDataService.getDocument.mockResolvedValue({
        mandala: mockMandalaDto,
        postits: [],
        characters: [],
      });

      const mockComparison: PostitComparison = {
        id: 'comparison-1',
        content: 'Test comparison',
        dimension: 'Dimension 1',
        section: 'Scale 1',
        tags: [],
        childrens: [],
        type: 'comparison',
        fromSummary: ['mandala-1', 'mandala-2'],
      };

      const mockReport: AiMandalaReport = {
        summary: 'Test summary',
        coincidences: [],
        tensions: [],
        insights: [],
      };

      postitService.generateComparisonPostits.mockResolvedValue({
        comparisons: [mockComparison],
        report: mockReport,
      });

      postitService.transformToPostitsWithCoordinates.mockReturnValue([]);

      // Simulate Firestore failure
      firebaseDataService.upsertDocument.mockRejectedValue(
        new Error('Firestore connection failed'),
      );

      const removeSpy = jest
        .spyOn(service, 'remove')
        .mockResolvedValue(mockOverlapMandalaDto);

      // Act & Assert
      await expect(
        service.createOverlapSummary(createOverlapDto),
      ).rejects.toThrow(InternalServerErrorException);

      // Verify cleanup was called
      expect(removeSpy).toHaveBeenCalledWith('overlap-mandala-1');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Removing mandala overlap-mandala-1 due to error',
        ),
      );
    });

    it('should not attempt to remove mandala if creation fails before mandala is created', async () => {
      // Arrange
      // Simulate failure during validation (before mandala creation)
      mandalaRepository.findOne.mockRejectedValue(
        new Error('Mandala not found'),
      );

      const removeSpy = jest.spyOn(service, 'remove');

      // Act & Assert
      await expect(
        service.createOverlapSummary(createOverlapDto),
      ).rejects.toThrow();

      // Verify cleanup was NOT called since mandala was never created
      expect(removeSpy).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException with correct error details', async () => {
      // Arrange
      mandalaRepository.create.mockResolvedValue(mockOverlapMandalaDto);
      firebaseDataService.getDocument.mockResolvedValue({
        mandala: mockMandalaDto,
        postits: [],
        characters: [],
      });

      const aiError = new Error('AI service timeout');
      postitService.generateComparisonPostits.mockRejectedValue(aiError);

      jest.spyOn(service, 'remove').mockResolvedValue(mockOverlapMandalaDto);

      // Act & Assert
      await expect(
        service.createOverlapSummary(createOverlapDto),
      ).rejects.toThrow(InternalServerErrorException);

      // Verify error details
      try {
        await service.createOverlapSummary(createOverlapDto);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        if (error instanceof InternalServerErrorException) {
          expect(error.message).toBe(
            OVERLAP_ERROR_MESSAGES.OVERLAP_OPERATION_FAILED,
          );
          expect(error.getResponse()).toMatchObject({
            message: OVERLAP_ERROR_MESSAGES.OVERLAP_OPERATION_FAILED,
            error: OVERLAP_ERROR_TYPES.OVERLAP_OPERATION_ERROR,
            details: {
              mandalaIds: createOverlapDto.mandalas,
              originalError: 'AI service timeout',
            },
          });
        }
      }
    });

    it('should successfully create overlap summary when no errors occur', async () => {
      // Arrange
      mandalaRepository.create.mockResolvedValue(mockOverlapMandalaDto);
      firebaseDataService.getDocument.mockResolvedValue({
        mandala: mockMandalaDto,
        postits: [],
        characters: [],
      });

      const mockComparison: PostitComparison = {
        id: 'comparison-1',
        content: 'Test comparison',
        dimension: 'Dimension 1',
        section: 'Scale 1',
        tags: [],
        childrens: [],
        type: 'comparison',
        fromSummary: ['mandala-1', 'mandala-2'],
      };

      const mockReport: AiMandalaReport = {
        summary: 'Test summary',
        coincidences: ['Coincidence 1'],
        tensions: ['Tension 1'],
        insights: ['Insight 1'],
      };

      postitService.generateComparisonPostits.mockResolvedValue({
        comparisons: [mockComparison],
        report: mockReport,
      });

      postitService.transformToPostitsWithCoordinates.mockReturnValue([
        {
          id: 'postit-1',
          content: 'Test comparison',
          dimension: 'Dimension 1',
          section: 'Scale 1',
          coordinates: { x: 0, y: 0 },
          tags: [],
          childrens: [],
        },
      ]);

      firebaseDataService.upsertDocument.mockResolvedValue(undefined);

      const removeSpy = jest.spyOn(service, 'remove');

      // Act
      const result = await service.createOverlapSummary(createOverlapDto);

      // Assert
      expect(result).toEqual({
        mandala: mockOverlapMandalaDto,
        summaryReport: mockReport,
      });
      expect(removeSpy).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Successfully created overlapped mandala'),
      );
    });
  });
});

