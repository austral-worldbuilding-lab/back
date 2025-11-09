import { PrismaService } from '@modules/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { ProjectRepository } from './project.repository';

type TransactionCallback = (tx: Prisma.TransactionClient) => Promise<unknown>;

describe('ProjectRepository - Recursive Deletion', () => {
  let projectRepository: ProjectRepository;
  let mockTransaction: jest.Mock;

  beforeEach(async () => {
    mockTransaction = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectRepository,
        {
          provide: PrismaService,
          useValue: {
            $transaction: mockTransaction,
          },
        },
      ],
    }).compile();

    projectRepository = module.get<ProjectRepository>(ProjectRepository);
  });

  describe('removeWithCascade', () => {
    it('should use a Prisma transaction', async () => {
      const projectId = 'test-project-id';

      mockTransaction.mockImplementation(
        async (callback: TransactionCallback) => {
          const tx = {
            project: {
              findMany: jest.fn().mockResolvedValue([]),
              update: jest.fn().mockResolvedValue({
                id: projectId,
                name: 'Test',
                configuration: {},
              }),
            },
            mandala: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
            projProvLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
            projSolLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          } as unknown as Prisma.TransactionClient;
          return await callback(tx);
        },
      );

      await projectRepository.removeWithCascade(projectId);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    // Verifica que se tomen los ids hijos
    it('should collect all child project IDs', async () => {
      const parentId = 'parent-1';
      const child1Id = 'child-1';
      const child2Id = 'child-2';

      mockTransaction.mockImplementation(
        async (callback: TransactionCallback) => {
          const tx = {
            project: {
              findMany: jest
                .fn()
                .mockResolvedValueOnce([{ id: child1Id }, { id: child2Id }])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]),
              update: jest
                .fn()
                .mockResolvedValue({ id: parentId, configuration: {} }),
            },
            mandala: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
            projProvLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
            projSolLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          } as unknown as Prisma.TransactionClient;
          return await callback(tx);
        },
      );

      await projectRepository.removeWithCascade(parentId);

      expect(mockTransaction).toHaveBeenCalled();
    });

    // Eliminacion de provocaciones
    it('should delete all ProjProvLink entries for project and children', async () => {
      const projectId = 'project-1';
      const childId = 'child-1';
      let deletedProjProvLinkIds: string[] = [];

      mockTransaction.mockImplementation(
        async (callback: TransactionCallback) => {
          const tx = {
            project: {
              findMany: jest
                .fn()
                .mockResolvedValueOnce([{ id: childId }])
                .mockResolvedValueOnce([]),
              update: jest
                .fn()
                .mockResolvedValue({ id: projectId, configuration: {} }),
            },
            mandala: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
            projProvLink: {
              deleteMany: jest
                .fn()
                .mockImplementation(
                  (params: { where: { projectId: { in: string[] } } }) => {
                    deletedProjProvLinkIds = params.where.projectId.in;
                    return Promise.resolve({ count: 2 });
                  },
                ),
            },
            projSolLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          } as unknown as Prisma.TransactionClient;
          return await callback(tx);
        },
      );

      await projectRepository.removeWithCascade(projectId);

      expect(deletedProjProvLinkIds).toContain(projectId);
      expect(deletedProjProvLinkIds).toContain(childId);
    });

    // Eliminacion de soluciones
    it('should delete all ProjSolLink entries for project and children', async () => {
      const projectId = 'project-1';
      const childId = 'child-1';
      let deletedProjSolLinkIds: string[] = [];

      mockTransaction.mockImplementation(
        async (callback: TransactionCallback) => {
          const tx = {
            project: {
              findMany: jest
                .fn()
                .mockResolvedValueOnce([{ id: childId }])
                .mockResolvedValueOnce([]),
              update: jest
                .fn()
                .mockResolvedValue({ id: projectId, configuration: {} }),
            },
            mandala: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
            projProvLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
            projSolLink: {
              deleteMany: jest
                .fn()
                .mockImplementation(
                  (params: { where: { projectId: { in: string[] } } }) => {
                    deletedProjSolLinkIds = params.where.projectId.in;
                    return Promise.resolve({ count: 1 });
                  },
                ),
            },
          } as unknown as Prisma.TransactionClient;
          return await callback(tx);
        },
      );

      await projectRepository.removeWithCascade(projectId);

      expect(deletedProjSolLinkIds).toContain(projectId);
      expect(deletedProjSolLinkIds).toContain(childId);
    });

    // soft-delete mandalas
    it('should soft delete all mandalas for project and children', async () => {
      const projectId = 'project-1';
      const childId = 'child-1';
      let softDeletedMandalaIds: string[] = [];
      let mandalaUpdateData: { isActive: boolean; deletedAt: Date } | undefined;

      mockTransaction.mockImplementation(
        async (callback: TransactionCallback) => {
          const tx = {
            project: {
              findMany: jest
                .fn()
                .mockResolvedValueOnce([{ id: childId }])
                .mockResolvedValueOnce([]),
              update: jest
                .fn()
                .mockResolvedValue({ id: projectId, configuration: {} }),
            },
            mandala: {
              updateMany: jest
                .fn()
                .mockImplementation(
                  (params: {
                    where: { projectId: { in: string[] } };
                    data: { isActive: boolean; deletedAt: Date };
                  }) => {
                    softDeletedMandalaIds = params.where.projectId.in;
                    mandalaUpdateData = params.data;
                    return Promise.resolve({ count: 3 });
                  },
                ),
            },
            projProvLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
            projSolLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          } as unknown as Prisma.TransactionClient;
          return await callback(tx);
        },
      );

      await projectRepository.removeWithCascade(projectId);

      expect(softDeletedMandalaIds).toContain(projectId);
      expect(softDeletedMandalaIds).toContain(childId);
      expect(mandalaUpdateData?.isActive).toBe(false);
      expect(mandalaUpdateData?.deletedAt).toBeInstanceOf(Date);
    });

    // soft-delete proyectos hijos
    it('should soft delete all child projects', async () => {
      const projectId = 'project-1';
      const child1Id = 'child-1';
      const child2Id = 'child-2';
      const updatedProjects: string[] = [];

      mockTransaction.mockImplementation(
        async (callback: TransactionCallback) => {
          const tx = {
            project: {
              findMany: jest
                .fn()
                .mockResolvedValueOnce([{ id: child1Id }, { id: child2Id }])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]),
              update: jest
                .fn()
                .mockImplementation((params: { where: { id: string } }) => {
                  updatedProjects.push(params.where.id);
                  return Promise.resolve({
                    id: params.where.id,
                    configuration: {},
                    isActive: false,
                    deletedAt: new Date(),
                  });
                }),
            },
            mandala: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
            projProvLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
            projSolLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          } as unknown as Prisma.TransactionClient;
          return await callback(tx);
        },
      );

      await projectRepository.removeWithCascade(projectId);

      expect(updatedProjects).toContain(child1Id);
      expect(updatedProjects).toContain(child2Id);
      expect(updatedProjects).toContain(projectId);
    });

    // verios hijos
    it('should handle multiple levels of hierarchy (grandchildren)', async () => {
      const rootId = 'root';
      const parentId = 'parent';
      const childId = 'child';
      const collectedIds: string[] = [];

      mockTransaction.mockImplementation(
        async (callback: TransactionCallback) => {
          const tx = {
            project: {
              findMany: jest
                .fn()
                .mockImplementation(
                  (params: { where: { parentProjectId: string } }) => {
                    const parentProjectId = params.where.parentProjectId;
                    if (parentProjectId === rootId) {
                      return Promise.resolve([{ id: parentId }]);
                    } else if (parentProjectId === parentId) {
                      return Promise.resolve([{ id: childId }]);
                    }
                    return Promise.resolve([]);
                  },
                ),
              update: jest
                .fn()
                .mockImplementation((params: { where: { id: string } }) => {
                  collectedIds.push(params.where.id);
                  return Promise.resolve({
                    id: params.where.id,
                    configuration: {},
                  });
                }),
            },
            mandala: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
            projProvLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
            projSolLink: {
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
          } as unknown as Prisma.TransactionClient;
          return await callback(tx);
        },
      );

      await projectRepository.removeWithCascade(rootId);

      // Todos los niveles deben ser eliminados
      expect(collectedIds).toContain(rootId);
      expect(collectedIds).toContain(parentId);
      expect(collectedIds).toContain(childId);
    });
  });
});
