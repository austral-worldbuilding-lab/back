import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Solution, Provocation, ImpactLevel } from '@prisma/client';

import { CreateSolutionDto } from './dto/create-solution.dto';
import { SolutionDto } from './dto/solution.dto';

@Injectable()
export class SolutionRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    projectId: string,
    createSolutionDto: CreateSolutionDto,
  ): Promise<SolutionDto> {
    const { provocationIds, impact, ...solutionData } = createSolutionDto;
    const solution = await this.prisma.solution.create({
      data: {
        ...solutionData,
        impactLevel: impact?.level?.toUpperCase() as ImpactLevel | undefined,
        impactDescription: impact?.description,
        projects: {
          create: {
            projectId,
            role: 'GENERATED',
          },
        },
        provocations: provocationIds
          ? {
              create: provocationIds.map((provocationId) => ({
                provocationId,
              })),
            }
          : undefined,
      },
      include: {
        provocations: {
          include: {
            provocation: true,
          },
        },
      },
    });

    return this.parseToSolutionDto(solution);
  }

  async findAll(projectId: string): Promise<SolutionDto[]> {
    const solutions = await this.prisma.solution.findMany({
      where: {
        isActive: true,
        projects: {
          some: {
            projectId,
          },
        },
      },
      include: {
        provocations: {
          include: {
            provocation: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return solutions.map((solution) => this.parseToSolutionDto(solution));
  }

  async findOne(id: string): Promise<SolutionDto | null> {
    const solution = await this.prisma.solution.findUnique({
      where: { id },
      include: {
        provocations: {
          include: {
            provocation: true,
          },
        },
      },
    });

    if (!solution) return null;
    return this.parseToSolutionDto(solution);
  }

  async remove(id: string): Promise<SolutionDto> {
    const solution = await this.prisma.solution.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
      include: {
        provocations: {
          include: {
            provocation: true,
          },
        },
      },
    });

    return this.parseToSolutionDto(solution);
  }

  private parseToSolutionDto(
    solution: Solution & {
      provocations: Array<{
        provocation: Provocation;
      }>;
    },
  ): SolutionDto {
    return {
      id: solution.id,
      title: solution.title,
      description: solution.description,
      problem: solution.problem,
      impact:
        solution.impactLevel || solution.impactDescription
          ? {
              level:
                (solution.impactLevel?.toLowerCase() as
                  | 'low'
                  | 'medium'
                  | 'high') || 'low',
              description: solution.impactDescription || '',
            }
          : undefined,
      provocations: solution.provocations.map(
        (p) => p.provocation.question || '',
      ),
      createdAt: solution.createdAt,
      updatedAt: solution.updatedAt,
      deletedAt: solution.deletedAt,
    };
  }
}
