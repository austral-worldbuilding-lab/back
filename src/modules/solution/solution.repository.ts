import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable, BadRequestException } from '@nestjs/common';
import { Solution, Provocation, ImpactLevel, Prisma } from '@prisma/client';

import { ActionItemDto } from './dto/action-item.dto';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { SolutionDto } from './dto/solution.dto';
import { UpdateSolutionDto } from './dto/update-solution.dto';

@Injectable()
export class SolutionRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    projectId: string,
    createSolutionDto: CreateSolutionDto,
  ): Promise<SolutionDto> {
    const { provocationIds, impact, ...solutionData } = createSolutionDto;

    // Validate provocations exist if provided
    //TODO: move this to provocations service when available
    if (provocationIds && provocationIds.length > 0) {
      const existingProvocations = await this.prisma.provocation.findMany({
        where: { id: { in: provocationIds } },
        select: { id: true },
      });

      if (existingProvocations.length !== provocationIds.length) {
        const existingIds = existingProvocations.map((p) => p.id);
        const missingIds = provocationIds.filter(
          (id) => !existingIds.includes(id),
        );
        throw new BadRequestException(
          `Provocations not found: ${missingIds.join(', ')}`,
        );
      }
    }

    const provocationLinks =
      provocationIds && provocationIds.length > 0
        ? {
            create: provocationIds.map((provocationId) => ({
              provocationId,
            })),
          }
        : undefined;

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
        provocations: provocationLinks,
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
        projects: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!solution || !solution.isActive) {
      return null;
    }

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

  async update(
    id: string,
    updateSolutionDto: UpdateSolutionDto,
  ): Promise<SolutionDto> {
    const { provocationIds, impact, actionItems, ...solutionData } =
      updateSolutionDto;

    // Validate provocations exist if provided
    if (provocationIds && provocationIds.length > 0) {
      const existingProvocations = await this.prisma.provocation.findMany({
        where: { id: { in: provocationIds } },
        select: { id: true },
      });

      if (existingProvocations.length !== provocationIds.length) {
        const existingIds = existingProvocations.map((p) => p.id);
        const missingIds = provocationIds.filter(
          (id) => !existingIds.includes(id),
        );
        throw new BadRequestException(
          `Provocations not found: ${missingIds.join(', ')}`,
        );
      }
    }

    // Build update data
    const updateData: Prisma.SolutionUpdateInput = {};

    if (solutionData.title !== undefined) {
      updateData.title = solutionData.title;
    }
    if (solutionData.description !== undefined) {
      updateData.description = solutionData.description;
    }
    if (solutionData.problem !== undefined) {
      updateData.problem = solutionData.problem;
    }

    // Handle impact
    if (impact !== undefined) {
      if (impact === null) {
        // Explicitly set to null to clear impact
        updateData.impactLevel = null;
        updateData.impactDescription = null;
      } else {
        updateData.impactLevel = impact.level
          ? (impact.level.toUpperCase() as ImpactLevel)
          : null;
        updateData.impactDescription = impact.description || null;
      }
    }

    // Handle action items
    if (actionItems !== undefined) {
      if (actionItems === null) {
        updateData.actionItems = Prisma.DbNull;
      } else {
        updateData.actionItems =
          actionItems as unknown as Prisma.InputJsonValue;
      }
    }

    // Use transaction to handle provocations update
    const solution = await this.prisma.$transaction(async (tx) => {
      // Update provocations if provided
      if (provocationIds !== undefined) {
        // Delete existing provocation links
        await tx.solProvLink.deleteMany({
          where: { solutionId: id },
        });

        // Create new provocation links if provided
        if (provocationIds.length > 0) {
          await tx.solProvLink.createMany({
            data: provocationIds.map((provocationId) => ({
              solutionId: id,
              provocationId,
            })),
          });
        }
      }

      // Update solution
      const updatedSolution = await tx.solution.update({
        where: { id },
        data: updateData,
        include: {
          provocations: {
            include: {
              provocation: true,
            },
          },
        },
      });

      return updatedSolution;
    });

    return this.parseToSolutionDto(solution);
  }

  async updateActionItems(
    solutionId: string,
    actionItems: ActionItemDto[],
  ): Promise<SolutionDto> {
    const solution = await this.prisma.solution.update({
      where: { id: solutionId },
      data: {
        actionItems: actionItems as unknown as Prisma.InputJsonValue,
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
    // Parse actionItems from JSON if present
    let actionItems: ActionItemDto[] | undefined;
    if (solution.actionItems) {
      if (Array.isArray(solution.actionItems)) {
        actionItems = solution.actionItems as unknown as ActionItemDto[];
      }
    }

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
      actionItems,
      createdAt: solution.createdAt,
      updatedAt: solution.updatedAt,
      deletedAt: solution.deletedAt,
    };
  }
}
