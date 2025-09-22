import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { AiUsage, Prisma } from '@prisma/client';

import { ConsumptionFilterDto } from './dto/consumption-filter.dto';
import { ConsumptionDto } from './dto/consumption.dto';
import { CreateConsumptionDto } from './dto/create-consumption.dto';

@Injectable()
export class ConsumptionRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    createConsumptionDto: CreateConsumptionDto,
  ): Promise<ConsumptionDto> {
    const aiUsage = await this.prisma.aiUsage.create({
      data: {
        service: createConsumptionDto.service,
        model: createConsumptionDto.model,
        userId: createConsumptionDto.userId,
        projectId: createConsumptionDto.projectId,
        organizationId: createConsumptionDto.organizationId,
        quantity: createConsumptionDto.quantity,
      },
    });

    return this.parseToConsumptionDto(aiUsage);
  }

  async findAllPaginated(
    skip: number,
    take: number,
    filter?: ConsumptionFilterDto,
  ): Promise<[ConsumptionDto[], number]> {
    const whereClause: Prisma.AiUsageWhereInput = {};

    if (filter) {
      if (filter.userId) whereClause.userId = filter.userId;
      if (filter.projectId) whereClause.projectId = filter.projectId;
      if (filter.organizationId)
        whereClause.organizationId = filter.organizationId;
      if (filter.service) whereClause.service = filter.service;
      if (filter.model) whereClause.model = filter.model;

      if (filter.startDate || filter.endDate) {
        whereClause.timestamp = {};
        if (filter.startDate) {
          whereClause.timestamp.gte = new Date(filter.startDate);
        }
        if (filter.endDate) {
          whereClause.timestamp.lte = new Date(filter.endDate);
        }
      }
    }

    const [consumptions, total] = await this.prisma.$transaction([
      this.prisma.aiUsage.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.aiUsage.count({ where: whereClause }),
    ]);

    return [
      consumptions.map((consumption) =>
        this.parseToConsumptionDto(consumption),
      ),
      total,
    ];
  }

  async findOne(id: string): Promise<ConsumptionDto | null> {
    const aiUsage = await this.prisma.aiUsage.findUnique({
      where: { id },
    });

    if (!aiUsage) {
      return null;
    }

    return this.parseToConsumptionDto(aiUsage);
  }

  async findByUser(userId: string): Promise<ConsumptionDto[]> {
    const consumptions = await this.prisma.aiUsage.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    return consumptions.map((consumption) =>
      this.parseToConsumptionDto(consumption),
    );
  }

  async findByProject(projectId: string): Promise<ConsumptionDto[]> {
    const consumptions = await this.prisma.aiUsage.findMany({
      where: { projectId },
      orderBy: { timestamp: 'desc' },
    });

    return consumptions.map((consumption) =>
      this.parseToConsumptionDto(consumption),
    );
  }

  async findByOrganization(organizationId: string): Promise<ConsumptionDto[]> {
    const consumptions = await this.prisma.aiUsage.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
    });

    return consumptions.map((consumption) =>
      this.parseToConsumptionDto(consumption),
    );
  }

  async getTotalConsumptionByUser(userId: string): Promise<number> {
    const result = await this.prisma.aiUsage.aggregate({
      where: { userId },
      _sum: { quantity: true },
    });

    return result._sum.quantity || 0;
  }

  async getTotalConsumptionByProject(projectId: string): Promise<number> {
    const result = await this.prisma.aiUsage.aggregate({
      where: { projectId },
      _sum: { quantity: true },
    });

    return result._sum.quantity || 0;
  }

  async getTotalConsumptionByOrganization(
    organizationId: string,
  ): Promise<number> {
    const result = await this.prisma.aiUsage.aggregate({
      where: { organizationId },
      _sum: { quantity: true },
    });

    return result._sum.quantity || 0;
  }

  async getConsumptionStatsByService(
    userId?: string,
    projectId?: string,
    organizationId?: string,
  ) {
    const whereClause: Prisma.AiUsageWhereInput = {};
    if (userId) whereClause.userId = userId;
    if (projectId) whereClause.projectId = projectId;
    if (organizationId) whereClause.organizationId = organizationId;

    return this.prisma.aiUsage.groupBy({
      by: ['service'],
      where: whereClause,
      _sum: { quantity: true },
      _count: { id: true },
    });
  }

  async getConsumptionStatsByModel(
    userId?: string,
    projectId?: string,
    organizationId?: string,
  ) {
    const whereClause: Prisma.AiUsageWhereInput = {};
    if (userId) whereClause.userId = userId;
    if (projectId) whereClause.projectId = projectId;
    if (organizationId) whereClause.organizationId = organizationId;

    return this.prisma.aiUsage.groupBy({
      by: ['model'],
      where: whereClause,
      _sum: { quantity: true },
      _count: { id: true },
    });
  }

  private parseToConsumptionDto(aiUsage: AiUsage): ConsumptionDto {
    return {
      id: aiUsage.id,
      timestamp: aiUsage.timestamp,
      service: aiUsage.service,
      model: aiUsage.model,
      userId: aiUsage.userId,
      projectId: aiUsage.projectId ?? undefined,
      organizationId: aiUsage.organizationId ?? undefined,
      quantity: aiUsage.quantity,
    };
  }
}
