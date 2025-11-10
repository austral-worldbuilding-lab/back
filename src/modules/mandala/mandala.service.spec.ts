import { InternalServerErrorException } from '@common/exceptions/custom-exceptions';
import { CacheService } from '@common/services/cache.service';
import { AppLogger } from '@common/services/logger.service';
import { AiService } from '@modules/ai/ai.service';
import { TextStorageService } from '@modules/files/services/text-storage.service';
import { FirebaseDataService } from '@modules/firebase/firebase-data.service';
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
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Suite de tests para verificar el comportamiento de cleanup (limpieza) en createOverlapSummary
 *
 * Objetivo: Asegurar que si falla la creación de una mandala comparada (overlap summary),
 * se elimine la mandala creada de la base de datos y Firestore.
 */
describe('MandalaService - createOverlapSummary cleanup', () => {
  // Variables para almacenar las instancias de servicio y mocks
  let service: MandalaService;
  let mandalaRepository: jest.Mocked<MandalaRepository>;
  let firebaseDataService: jest.Mocked<FirebaseDataService>;
  let postitService: jest.Mocked<PostitService>;

  // Datos de prueba: Mandala de ejemplo tipo CHARACTER
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

  // Datos de prueba: Mandala de tipo OVERLAP_SUMMARY (la que se crea en el test)
  const mockOverlapMandalaDto: MandalaDto = {
    ...mockMandalaDto,
    id: 'overlap-mandala-1',
    name: 'Overlap Mandala',
    type: MandalaType.OVERLAP_SUMMARY,
  };

  /**
   * beforeEach: Se ejecuta ANTES de cada test (it)
   *
   * Propósito:
   * - Crear un módulo de testing limpio para cada test
   * - Configurar todos los mocks necesarios
   * - Asegurar que cada test empiece con un estado fresco (sin contaminación entre tests)
   */
  beforeEach(async () => {
    // Crear un módulo de testing de NestJS con todas las dependencias
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // El servicio REAL que vamos a testear (System Under Test - SUT)
        MandalaService,

        // MOCK: MandalaRepository - Simula interacción con PostgreSQL
        {
          provide: MandalaRepository,
          useValue: {
            create: jest.fn(), // Simula crear mandala en DB
            findOne: jest.fn(), // Simula buscar mandala por ID
            remove: jest.fn(), // Simula eliminar mandala de DB
            findChildrenMandalasCenters: jest.fn().mockResolvedValue([]), // Simula buscar mandalas hijas
          },
        },

        // MOCK: FirebaseDataService - Simula interacción con Firestore
        {
          provide: FirebaseDataService,
          useValue: {
            createDocument: jest.fn(), // Simula crear documento en Firestore
            getDocument: jest.fn(), // Simula obtener documento de Firestore
            upsertDocument: jest.fn(), // Simula actualizar/insertar en Firestore
            deleteDocument: jest.fn(), // Simula eliminar documento de Firestore
          },
        },

        // MOCK: PostitService - Simula generación de postits con IA
        {
          provide: PostitService,
          useValue: {
            generateComparisonPostits: jest.fn(), // Simula llamada a IA para generar postits
            transformToPostitsWithCoordinates: jest.fn(), // Simula transformación de postits
          },
        },

        // MOCK: ImageService - No se usa en estos tests, pero es dependencia del servicio
        {
          provide: ImageService,
          useValue: {},
        },

        // MOCK: ProjectService - Simula manejo de proyectos
        {
          provide: ProjectService,
          useValue: {
            findOne: jest.fn(), // Simula buscar proyecto
          },
        },

        // MOCK: AiService - No se usa directamente en estos tests
        {
          provide: AiService,
          useValue: {},
        },

        // MOCK: CacheService - No se usa en estos tests
        {
          provide: CacheService,
          useValue: {},
        },

        // MOCK: AppLogger - Simula el logger (evita spam en consola durante tests)
        {
          provide: AppLogger,
          useValue: {
            setContext: jest.fn(), // Llamado en el constructor de MandalaService
            log: jest.fn(), // Registra logs de info
            warn: jest.fn(), // Registra warnings
            error: jest.fn(), // Registra errores
            debug: jest.fn(), // Registra debug info
          },
        },

        // MOCK: NotificationService - Simula envío de notificaciones
        {
          provide: NotificationService,
          useValue: {},
        },

        // MOCK: OrganizationService - Simula manejo de organizaciones
        {
          provide: OrganizationService,
          useValue: {},
        },

        {
          provide: TextStorageService,
          useValue: {},
        },

        {
          provide: AzureBlobStorageService,
          useValue: {
            uploadBuffer: jest.fn(),
            buildPublicUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    // Obtener la instancia del servicio y los mocks del módulo de testing
    service = module.get<MandalaService>(MandalaService);
    mandalaRepository = module.get(MandalaRepository);
    firebaseDataService = module.get(FirebaseDataService);
    postitService = module.get(PostitService);
  });

  /**
   * Grupo de tests para verificar el manejo de errores y cleanup
   */
  describe('createOverlapSummary - error handling and cleanup', () => {
    // DTO de ejemplo para crear una mandala overlap (entrada del método)
    const createOverlapDto: CreateOverlappedMandalaDto = {
      name: 'Test Overlap Summary',
      color: '#0000FF',
      mandalas: ['mandala-1', 'mandala-2'], // IDs de las mandalas a comparar
    };

    /**
     * beforeEach interno: Se ejecuta antes de cada test de este bloque describe
     * Configura mocks comunes para todos los tests de este grupo
     */
    beforeEach(() => {
      // Setup common mocks
      mandalaRepository.findOne.mockResolvedValue(mockMandalaDto); // findOne siempre retorna mandala válida
      firebaseDataService.createDocument.mockResolvedValue(undefined); // createDocument siempre exitoso
    });

    /**
     * TEST 1: Verificar cleanup cuando falla la generación de postits de la IA
     *
     * Escenario:
     * 1. Se crea exitosamente la mandala en la DB
     * 2. La IA FALLA al generar los postits de comparación
     * 3. El sistema debe ELIMINAR la mandala creada (cleanup)
     */
    it('should remove mandala from database and Firestore when AI comparison postits generation fails', async () => {
      // Configurar mock para creación exitosa de mandala en DB
      mandalaRepository.create.mockResolvedValue(mockOverlapMandalaDto);

      // Configurar el mock para que getDocument retorne un documento de Firestore válido
      firebaseDataService.getDocument.mockResolvedValue({
        mandala: mockMandalaDto,
        postits: [],
        characters: [],
      });

      // Configurar el mock para que la IA falle (lance una excepción)
      postitService.generateComparisonPostits.mockRejectedValue(
        new Error('AI service connection failed'),
      );

      // Crear un espía en 'remove' para verificar que se llame
      const removeSpy = jest
        .spyOn(service, 'remove')
        .mockResolvedValue(mockOverlapMandalaDto);

      // Ejecutar y verificar que lance un error
      await expect(
        service.createOverlapSummary(createOverlapDto),
      ).rejects.toThrow(InternalServerErrorException);

      // Verificar que se hizo cleanup (eliminó la mandala creada) llamando a remove
      expect(removeSpy).toHaveBeenCalledWith('overlap-mandala-1');
    });

    /**
     * TEST 2: Verificar cleanup cuando la IA retorna null en el reporte
     *
     * Escenario:
     * 1. Se crea exitosamente la mandala en la DB
     * 2. La IA responde pero el reporte es NULL (respuesta inválida)
     * 3. El sistema debe ELIMINAR la mandala creada (cleanup)
     */
    it('should remove mandala when AI report generation returns null', async () => {
      // Configurar mock para creación exitosa de mandala en DB
      mandalaRepository.create.mockResolvedValue(mockOverlapMandalaDto);
      firebaseDataService.getDocument.mockResolvedValue({
        mandala: mockMandalaDto,
        postits: [],
        characters: [],
      });

      // Simular que la IA responde PERO con report: null (respuesta inválida)
      postitService.generateComparisonPostits.mockResolvedValue({
        comparisons: [],
        report: null as unknown as AiMandalaReport, // NULL indica que la IA no generó el reporte
      });

      const removeSpy = jest
        .spyOn(service, 'remove')
        .mockResolvedValue(mockOverlapMandalaDto);

      // Ejecutar y verificar que lance un error
      await expect(
        service.createOverlapSummary(createOverlapDto),
      ).rejects.toThrow(InternalServerErrorException);

      // Verificar que se hizo cleanup (eliminó la mandala creada)
      expect(removeSpy).toHaveBeenCalledWith('overlap-mandala-1');
    });

    /**
     * TEST 3: Verificar cleanup cuando falla Firestore
     *
     * Escenario:
     * 1. Se crea exitosamente la mandala en la DB
     * 2. La IA genera los postits exitosamente
     * 3. Firestore FALLA al guardar los datos
     * 4. El sistema debe ELIMINAR la mandala creada (cleanup)
     */
    it('should remove mandala when Firestore upsert fails', async () => {
      mandalaRepository.create.mockResolvedValue(mockOverlapMandalaDto);
      firebaseDataService.getDocument.mockResolvedValue({
        mandala: mockMandalaDto,
        postits: [],
        characters: [],
      });

      // Crear un postit de comparación de ejemplo (respuesta válida de la IA)
      const mockComparison: PostitComparison = {
        id: 'comparison-1',
        content: 'Test comparison',
        dimension: 'Dimension 1',
        section: 'Scale 1',
        tags: [],
        childrens: [],
        type: 'SIMILITUD',
        fromSummary: ['mandala-1', 'mandala-2'],
      };

      // Crear un reporte de IA de ejemplo (respuesta válida)
      const mockReport: AiMandalaReport = {
        summary: 'Test summary',
        coincidences: [],
        tensions: [],
        insights: [],
      };

      // Configurar que la IA responde EXITOSAMENTE
      postitService.generateComparisonPostits.mockResolvedValue({
        comparisons: [mockComparison],
        report: mockReport,
      });

      // Configurar que la transformación de postits funciona
      postitService.transformToPostitsWithCoordinates.mockReturnValue([]);

      // Simular FALLO en Firestore al intentar guardar
      firebaseDataService.upsertDocument.mockRejectedValue(
        new Error('Firestore connection failed'),
      );

      const removeSpy = jest
        .spyOn(service, 'remove')
        .mockResolvedValue(mockOverlapMandalaDto);

      // Ejecutar y verificar
      await expect(
        service.createOverlapSummary(createOverlapDto),
      ).rejects.toThrow(InternalServerErrorException);

      // Verificar que se hizo cleanup a pesar de que la IA funcionó correctamente
      expect(removeSpy).toHaveBeenCalledWith('overlap-mandala-1');
    });

    /**
     * TEST 4: Verificar que NO se intenta cleanup si falla ANTES de crear la mandala
     *
     * Escenario:
     * 1. Falla la validación inicial (findOne lanza error)
     * 2. NUNCA se llega a crear la mandala
     * 3. El sistema NO debe intentar eliminar nada (no hay nada que limpiar)
     */
    it('should not attempt to remove mandala if creation fails before mandala is created', async () => {
      // Simular fallo durante la validación inicial (antes de crear la mandala)
      mandalaRepository.findOne.mockRejectedValue(
        new Error('Mandala not found'),
      );

      // Crear espía en remove para verificar que NO se llame
      const removeSpy = jest.spyOn(service, 'remove');

      // Ejecutar y verificar que lance un error
      await expect(
        service.createOverlapSummary(createOverlapDto),
      ).rejects.toThrow();

      // Verificar que NO se intentó hacer cleanup (no había mandala para eliminar)
      expect(removeSpy).not.toHaveBeenCalled();
    });

    /**
     * TEST 5: Verificar creación exitosa cuando no hay errores
     *
     * Escenario:
     * 1. Todo funciona correctamente
     * 2. Se crea la mandala en DB
     * 3. La IA genera los postits exitosamente
     * 4. Se guarda en Firestore exitosamente
     * 5. NO se debe hacer cleanup
     * 6. Se retorna el resultado esperado
     */
    it('should successfully create overlap summary when no errors occur', async () => {
      // Configurar mock para creación exitosa de mandala en DB
      mandalaRepository.create.mockResolvedValue(mockOverlapMandalaDto);
      firebaseDataService.getDocument.mockResolvedValue({
        mandala: mockMandalaDto,
        postits: [],
        characters: [],
      });

      // Crear datos de ejemplo válidos
      const mockComparison: PostitComparison = {
        id: 'postit-1',
        content: 'Test comparison',
        dimension: 'Dimension 1',
        section: 'Scale 1',
        tags: [],
        childrens: [],
        type: 'SIMILITUD',
        fromSummary: ['mandala-1', 'mandala-2'],
      };

      const mockReport: AiMandalaReport = {
        summary: 'Test summary',
        coincidences: ['Coincidence 1'],
        tensions: ['Tension 1'],
        insights: ['Insight 1'],
      };

      // Configurar todos los mocks para que funcionen exitosamente
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

      // Crear espía para verificar que NO se llame a remove
      const removeSpy = jest.spyOn(service, 'remove');

      // Ejecución
      const result = await service.createOverlapSummary(createOverlapDto);

      // Verificar que el resultado contiene la mandala y el reporte
      expect(result).toEqual({
        mandala: mockOverlapMandalaDto,
        summaryReport: mockReport,
      });

      // Verificar que NO se hizo cleanup (porque todo fue exitoso)
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });
});
