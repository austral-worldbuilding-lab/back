import { AppLogger } from '@common/services/logger.service';
import { Injectable } from '@nestjs/common';

import { ConsumptionRepository } from './consumption.repository';
import { ConsumptionFilterDto } from './dto/consumption-filter.dto';
import { ConsumptionDto } from './dto/consumption.dto';
import { CreateConsumptionDto } from './dto/create-consumption.dto';

@Injectable()
export class ConsumptionService {
  constructor(
    private readonly consumptionRepository: ConsumptionRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ConsumptionService.name);
  }

  async create(
    createConsumptionDto: CreateConsumptionDto,
  ): Promise<ConsumptionDto> {
    this.logger.log(
      `Creating consumption record for user ${createConsumptionDto.userId}, service: ${createConsumptionDto.service}, quantity: ${createConsumptionDto.quantity}`,
    );

    return this.consumptionRepository.create(createConsumptionDto);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filter?: ConsumptionFilterDto,
  ): Promise<{
    data: ConsumptionDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.consumptionRepository.findAllPaginated(
      skip,
      limit,
      filter,
    );

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ConsumptionDto | null> {
    return this.consumptionRepository.findOne(id);
  }

  async findByUser(userId: string): Promise<ConsumptionDto[]> {
    return this.consumptionRepository.findByUser(userId);
  }

  async findByProject(projectId: string): Promise<ConsumptionDto[]> {
    return this.consumptionRepository.findByProject(projectId);
  }

  async findByOrganization(organizationId: string): Promise<ConsumptionDto[]> {
    return this.consumptionRepository.findByOrganization(organizationId);
  }

  async getUserTotalConsumption(userId: string): Promise<number> {
    return this.consumptionRepository.getTotalConsumptionByUser(userId);
  }

  async getProjectTotalConsumption(projectId: string): Promise<number> {
    return this.consumptionRepository.getTotalConsumptionByProject(projectId);
  }

  async getOrganizationTotalConsumption(
    organizationId: string,
  ): Promise<number> {
    return this.consumptionRepository.getTotalConsumptionByOrganization(
      organizationId,
    );
  }

  async getConsumptionStatsByService(
    userId?: string,
    projectId?: string,
    organizationId?: string,
  ) {
    const stats = await this.consumptionRepository.getConsumptionStatsByService(
      userId,
      projectId,
      organizationId,
    );

    return stats.map((stat) => ({
      service: stat.service,
      totalTokens: stat._sum.quantity || 0,
      totalUsages: stat._count.id,
    }));
  }

  async getConsumptionStatsByModel(
    userId?: string,
    projectId?: string,
    organizationId?: string,
  ) {
    const stats = await this.consumptionRepository.getConsumptionStatsByModel(
      userId,
      projectId,
      organizationId,
    );

    return stats.map((stat) => ({
      model: stat.model,
      totalTokens: stat._sum.quantity || 0,
      totalUsages: stat._count.id,
    }));
  }

  async trackAiUsage(
    userId: string,
    service: CreateConsumptionDto['service'],
    model: CreateConsumptionDto['model'],
    quantity: number,
    projectId?: string,
    organizationId?: string,
  ): Promise<ConsumptionDto> {
    const createConsumptionDto: CreateConsumptionDto = {
      userId,
      service,
      model,
      quantity,
      projectId,
      organizationId,
    };

    this.logger.log(
      `Tracking AI usage: User ${userId}, Service ${service}, Model ${model}, Tokens ${quantity}${projectId ? `, Project ${projectId}` : ''}${organizationId ? `, Organization ${organizationId}` : ''}`,
    );

    return this.create(createConsumptionDto);
  }
}
