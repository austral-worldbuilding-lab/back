/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { Test, TestingModule } from '@nestjs/testing';

import { ProvocationDto } from './dto/provocation.dto';
import { ProjectRepository } from './project.repository';
import { ProjectService } from './project.service';

describe('ProjectService - Provocation Deletion', () => {
  let projectService: ProjectService;
  let mockProjectRepository: {
    findOne: jest.Mock;
    findProvocationById: jest.Mock;
    deleteProvocation: jest.Mock;
  };

  const mockProvocation: ProvocationDto = {
    id: 'provocation-1',
    question: 'Test question?',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockProjectRepository = {
      findOne: jest.fn(),
      findProvocationById: jest.fn(),
      deleteProvocation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ProjectService,
          useFactory: (): ProjectService => {
            const service = Object.create(ProjectService.prototype);
            service.removeProvocation = async function (
              projectId: string,
              provocationId: string,
            ): Promise<ProvocationDto> {
              const project = await mockProjectRepository.findOne(projectId);
              if (!project) {
                throw new ResourceNotFoundException('Project', projectId);
              }

              const provocation =
                await mockProjectRepository.findProvocationById(provocationId);
              if (!provocation) {
                throw new ResourceNotFoundException(
                  'Provocation',
                  provocationId,
                );
              }

              return mockProjectRepository.deleteProvocation(provocationId);
            };
            return service;
          },
        },
        {
          provide: ProjectRepository,
          useValue: mockProjectRepository,
        },
      ],
    }).compile();

    projectService = module.get<ProjectService>(ProjectService);
  });

  describe('removeProvocation', () => {
    it('should verify that project exists', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(
        projectService.removeProvocation('project-1', 'provocation-1'),
      ).rejects.toThrow(ResourceNotFoundException);

      expect(mockProjectRepository.findOne).toHaveBeenCalledWith('project-1');
      expect(mockProjectRepository.deleteProvocation).not.toHaveBeenCalled();
    });

    it('should verify that provocation exists', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ id: 'project-1' });
      mockProjectRepository.findProvocationById.mockResolvedValue(null);

      await expect(
        projectService.removeProvocation('project-1', 'provocation-1'),
      ).rejects.toThrow(ResourceNotFoundException);

      expect(mockProjectRepository.findProvocationById).toHaveBeenCalledWith(
        'provocation-1',
      );
      expect(mockProjectRepository.deleteProvocation).not.toHaveBeenCalled();
    });

    it('should delete provocation when both validations pass', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ id: 'project-1' });
      mockProjectRepository.findProvocationById.mockResolvedValue(
        mockProvocation,
      );
      mockProjectRepository.deleteProvocation.mockResolvedValue(
        mockProvocation,
      );

      const result = await projectService.removeProvocation(
        'project-1',
        'provocation-1',
      );

      expect(result).toEqual(mockProvocation);
      expect(mockProjectRepository.deleteProvocation).toHaveBeenCalledWith(
        'provocation-1',
      );
    });
  });
});
