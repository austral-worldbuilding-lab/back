import { CreateMandalaDto } from '@modules/mandala/dto/create-mandala.dto';
import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CharacterListItemDto } from './dto/character-list-item.dto';
import { MandalaDto } from './dto/mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { CreateMandalaConfiguration } from './types/mandala-configuration.type';

import { MandalaCenter } from '@/modules/mandala/types/mandala-center.type';

type MandalaWithRelations = Prisma.MandalaGetPayload<{
  include: {
    children: { select: { id: true } };
    parent: { select: { id: true } };
  };
}>;

@Injectable()
export class MandalaRepository {
  constructor(private prisma: PrismaService) {}

  private parseToMandalaConfiguration(
    config: Prisma.JsonValue,
  ): CreateMandalaConfiguration {
    const parsedConfig = config as unknown as CreateMandalaConfiguration;

    return {
      center: parsedConfig.center,
      dimensions: parsedConfig.dimensions.map((dim) => ({
        name: dim.name,
        color: dim.color,
      })),
      scales: parsedConfig.scales,
    };
  }

  private parseToJson(
    config: CreateMandalaConfiguration,
  ): Prisma.InputJsonValue {
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
    } as Prisma.InputJsonValue;
  }

  private parseToMandalaDto(mandala: MandalaWithRelations): MandalaDto {
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
      childrenIds: mandala.children?.map((child) => child.id) || [],
      parentIds: mandala.parent?.map((parent) => parent.id) || [],
      createdAt: mandala.createdAt,
      updatedAt: mandala.updatedAt,
    };
  }

  async create(createMandalaDto: CreateMandalaDto): Promise<MandalaDto> {
    const configuration: CreateMandalaConfiguration = {
      center: createMandalaDto.center,
      dimensions: createMandalaDto.dimensions!,
      scales: createMandalaDto.scales!,
    };

    const mandala = await this.prisma.mandala.create({
      data: {
        name: createMandalaDto.name,
        projectId: createMandalaDto.projectId,
        configuration: this.parseToJson(configuration),
        ...(createMandalaDto.parentId && {
          parent: {
            connect: { id: createMandalaDto.parentId },
          },
        }),
      },
      include: {
        children: { select: { id: true } },
        parent: { select: { id: true } },
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
        include: {
          children: { select: { id: true } },
          parent: { select: { id: true } },
        },
      }),
      this.prisma.mandala.count({ where }),
    ]);

    return [mandalas.map((m) => this.parseToMandalaDto(m)), total];
  }

  async findOne(id: string): Promise<MandalaDto | null> {
    const mandala = await this.prisma.mandala.findUnique({
      where: { id },
      include: {
        children: { select: { id: true } },
        parent: { select: { id: true } },
      },
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
      include: {
        children: { select: { id: true } },
        parent: { select: { id: true } },
      },
    });

    return this.parseToMandalaDto(mandala);
  }

  async remove(id: string): Promise<MandalaDto> {
    const mandala = await this.prisma.mandala.delete({
      where: { id },
      include: {
        children: { select: { id: true } },
        parent: { select: { id: true } },
      },
    });

    return this.parseToMandalaDto(mandala);
  }

  async findAvailableMandalasForLinking(
    mandalaId: string,
    projectId: string,
  ): Promise<CharacterListItemDto[]> {
    const mandalas = await this.prisma.mandala.findMany({
      where: {
        projectId,
        id: { not: mandalaId },
        parent: {
          none: {
            id: mandalaId,
          },
        },
      },
    });

    return mandalas.map((mandala) => {
      const configuration = this.parseToMandalaConfiguration(
        mandala.configuration,
      );
      return {
        id: mandala.id,
        name: configuration.center.name,
        color: configuration.center.color,
      };
    });
  }

  async findChildrenMandalasCenters(
    mandalaId: string,
  ): Promise<MandalaCenter[]> {
    const mandala = await this.prisma.mandala.findUnique({
      where: { id: mandalaId },
      include: {
        children: true,
      },
    });

    if (!mandala || !mandala.children) {
      return [];
    }

    return mandala.children.map((childMandala) => {
      const configuration = this.parseToMandalaConfiguration(
        childMandala.configuration,
      );
      return {
        id: childMandala.id,
        ...configuration.center,
      };
    });
  }

  async linkMandala(parentId: string, childId: string): Promise<MandalaDto> {
    const mandala = await this.prisma.mandala.update({
      where: { id: parentId },
      data: {
        children: {
          connect: { id: childId },
        },
      },
      include: {
        children: { select: { id: true } },
        parent: { select: { id: true } },
      },
    });

    return this.parseToMandalaDto(mandala);
  }

  async unlinkMandala(parentId: string, childId: string): Promise<MandalaDto> {
    const mandala = await this.prisma.mandala.update({
      where: { id: parentId },
      data: {
        children: {
          disconnect: { id: childId },
        },
      },
      include: {
        children: { select: { id: true } },
        parent: { select: { id: true } },
      },
    });

    return this.parseToMandalaDto(mandala);
  }

  async findCharacterListByProject(
    projectId: string,
  ): Promise<CharacterListItemDto[]> {
    const mandalas = await this.prisma.mandala.findMany({
      where: { projectId },
      select: {
        id: true,
        configuration: true,
      },
    });

    return mandalas.map((mandala) => {
      const configuration = this.parseToMandalaConfiguration(
        mandala.configuration,
      );
      return {
        id: mandala.id,
        name: configuration.center.name,
        color: configuration.center.color,
      };
    });
  }
}
