import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { MandalaDto } from './dto/mandala.dto';
import { MandalaConfiguration } from './types/mandala-configuration.type';
import { Mandala, Prisma } from '@prisma/client';
import { CreateMandalaDto } from '@modules/mandala/dto/create-mandala.dto';

@Injectable()
export class MandalaRepository {
  constructor(private prisma: PrismaService) {}

  private parseToMandalaConfiguration(
    config: Prisma.JsonValue,
  ): MandalaConfiguration {
    const parsedConfig = config as unknown as MandalaConfiguration;

    return {
      dimensions: parsedConfig.dimensions.map((dim) => ({
        name: dim.name,
        color: dim.color,
      })),
      scales: parsedConfig.scales,
    };
  }

  private parseToJson(config: MandalaConfiguration): Prisma.InputJsonValue {
    return {
      dimensions: config.dimensions.map((dim) => ({
        name: dim.name,
        color: dim.color,
      })),
      scales: config.scales,
    };
  }

  private parseToMandalaDto(mandala: Mandala): MandalaDto {
    return {
      id: mandala.id,
      name: mandala.name,
      projectId: mandala.projectId,
      configuration: this.parseToMandalaConfiguration(mandala.configuration),
      linkedToId: mandala.linkedToId,
      createdAt: mandala.createdAt,
      updatedAt: mandala.updatedAt,
    };
  }

  async create(createMandalaDto: CreateMandalaDto): Promise<MandalaDto> {
    const configuration: MandalaConfiguration = {
      dimensions: createMandalaDto.dimensions!,
      scales: createMandalaDto.scales!,
    };

    const mandala = await this.prisma.mandala.create({
      data: {
        name: createMandalaDto.name,
        projectId: createMandalaDto.projectId,
        configuration: this.parseToJson(configuration),
        linkedToId: createMandalaDto.linkedToId,
      },
    });

    return this.parseToMandalaDto(mandala);
  }

  async findAllPaginated(
    projectId: string,
    skip: number,
    take: number,
  ): Promise<[MandalaDto[], number]> {
    const where = { projectId };
    const [mandalas, total] = await this.prisma.$transaction([
      this.prisma.mandala.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mandala.count({ where }),
    ]);

    return [mandalas.map((m) => this.parseToMandalaDto(m)), total];
  }

  async findOne(id: string): Promise<MandalaDto | null> {
    const mandala = await this.prisma.mandala.findUnique({
      where: { id },
    });

    if (!mandala) {
      return null;
    }

    return this.parseToMandalaDto(mandala);
  }

  async update(
    id: string,
    updateMandalaDto: UpdateMandalaDto,
  ): Promise<MandalaDto> {
    const mandala = await this.prisma.mandala.update({
      where: { id },
      data: {
        name: updateMandalaDto.name,
      },
    });

    return this.parseToMandalaDto(mandala);
  }

  async remove(id: string): Promise<MandalaDto> {
    const mandala = await this.prisma.mandala.delete({
      where: { id },
    });

    return this.parseToMandalaDto(mandala);
  }
}
