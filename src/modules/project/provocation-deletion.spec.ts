/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { PrismaService } from '@modules/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';

import { ProjectRepository } from './project.repository';

describe('ProjectRepository - Provocation Deletion', () => {
  let projectRepository: ProjectRepository;
  let mockPrisma: any;
  let mockTransaction: any;

  beforeEach(async () => {
    // Mock para las operaciones dentro de la transacción
    mockTransaction = {
      projProvLink: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      solProvLink: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      provocation: {
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    mockPrisma = {
      $transaction: jest.fn((callback) => callback(mockTransaction)),
      provocation: {
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    projectRepository = module.get<ProjectRepository>(ProjectRepository);
  });

  describe('deleteProvocation', () => {
    it('should soft delete by setting isActive=false and deletedAt', async () => {
      const provocationId = 'test-provocation-id';

      mockTransaction.provocation.update.mockResolvedValue({
        id: provocationId,
        question: 'Test question?',
        content: null,
        parentProvocationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: false,
        deletedAt: new Date(),
        projects: [],
      });

      await projectRepository.deleteProvocation(provocationId);

      // Verificar que se llama a la transacción
      expect(mockPrisma.$transaction).toHaveBeenCalled();

      // Verificar que se eliminan los links de ProjProvLink
      expect(mockTransaction.projProvLink.deleteMany).toHaveBeenCalledWith({
        where: { provocationId: provocationId },
      });

      // Verificar que se eliminan los links de SolProvLink
      expect(mockTransaction.solProvLink.deleteMany).toHaveBeenCalledWith({
        where: { provocationId: provocationId },
      });

      // Verificar que se hace soft delete de la provocación
      expect(mockTransaction.provocation.update).toHaveBeenCalledWith({
        where: { id: provocationId },
        data: {
          isActive: false,
          deletedAt: expect.any(Date),
        },
        include: {
          projects: {
            include: {
              project: true,
            },
          },
        },
      });
    });
  });

  describe('findProvocationById', () => {
    it('should query only active provocations (isActive: true)', async () => {
      const provocationId = 'test-provocation-id';

      mockPrisma.provocation.findFirst.mockResolvedValue({
        id: provocationId,
        question: 'Test question?',
        content: null,
        parentProvocationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        deletedAt: null,
        projects: [],
      });

      await projectRepository.findProvocationById(provocationId);

      expect(mockPrisma.provocation.findFirst).toHaveBeenCalledWith({
        where: {
          id: provocationId,
          isActive: true,
        },
        include: {
          projects: {
            include: {
              project: true,
            },
          },
        },
      });
    });

    it('should return null for deleted provocations', async () => {
      mockPrisma.provocation.findFirst.mockResolvedValue(null);
      const result = await projectRepository.findProvocationById('deleted-id');
      expect(result).toBeNull();
    });
  });
});
