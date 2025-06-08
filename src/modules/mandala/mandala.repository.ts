import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { MandalaDto } from './dto/mandala.dto';
import { MandalaConfiguration } from './types/mandala-configuration.type';
import { Mandala, Prisma } from '@prisma/client';
import { CreateMandalaDto } from '@modules/mandala/dto/create-mandala.dto';
import { CenterDto } from '@common/dto/center.dto';
import { LinkedMandalaCenterDto } from './dto/mandala-with-postits-and-linked-centers.dto';

@Injectable()
export class MandalaRepository {
  constructor(private prisma: PrismaService) {}

  private parseToMandalaConfiguration(
    config: Prisma.JsonValue,
  ): MandalaConfiguration {
    const parsedConfig = config as unknown as MandalaConfiguration;

    return {
      center: parsedConfig.center,
      dimensions: parsedConfig.dimensions.map((dim) => ({
        name: dim.name,
        color: dim.color,
      })),
      scales: parsedConfig.scales,
      linkedTo: parsedConfig.linkedTo,
    };
  }

  private parseToJson(config: MandalaConfiguration): Prisma.InputJsonValue {
    return {
      center: {
        name: config.center.name,
        description: config.center.description,
        color: config.center.color,
      },
      dimensions: config.dimensions.map((dim) => ({
        name: dim.name,
        color: dim.color,
      })),
      scales: config.scales,
      linkedTo: config.linkedTo,
    } as Prisma.InputJsonValue;
  }

  private parseToMandalaDto(mandala: Mandala): MandalaDto {
    const configuration = this.parseToMandalaConfiguration(
      mandala.configuration,
    );

    return {
      id: mandala.id,
      name: mandala.name,
      projectId: mandala.projectId,
      configuration: {
        center: configuration.center,
        dimensions: configuration.dimensions,
        scales: configuration.scales,
      },
      linkedToId: mandala.linkedToId,
      createdAt: mandala.createdAt,
      updatedAt: mandala.updatedAt,
    };
  }

  async create(createMandalaDto: CreateMandalaDto): Promise<MandalaDto> {
    const configuration: MandalaConfiguration = {
      center: createMandalaDto.center,
      dimensions: createMandalaDto.dimensions!,
      scales: createMandalaDto.scales!,
      linkedTo: createMandalaDto.linkedToId || null,
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

  async findLinkedMandalasCenters(mandalaId: string): Promise<LinkedMandalaCenterDto[]> {
    const mandala = await this.prisma.mandala.findUnique({
      where: { id: mandalaId },
      include: {
        linkedMandalas: true,
      },
    });

    if (!mandala || !mandala.linkedMandalas) {
      return [];
    }

    return mandala.linkedMandalas.map((linkedMandala) => {
      const configuration = this.parseToMandalaConfiguration(linkedMandala.configuration);
      return {
        center: configuration.center,
        position: {
          x: 0,
          y: 0,
        },
        section: '',
        dimension: '',
      };
    });
  }
}
