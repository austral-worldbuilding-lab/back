import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { MandalaDto } from './dto/mandala.dto';
import { CreateMandalaConfiguration } from './types/mandala-configuration.type';
import { Prisma } from '@prisma/client';
import { CreateMandalaDto } from '@modules/mandala/dto/create-mandala.dto';
import { MandalaCenter } from '@/modules/mandala/types/mandala-center.type';
import { CharacterListItemDto } from './dto/character-list-item.dto';

type MandalaWithRelations = Prisma.MandalaGetPayload<{
  include: {
    linkedMandalas: { select: { id: true } };
    linkedTo: { select: { id: true } };
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
      childrenIds: (
        (mandala.linkedMandalas ?? []) as Array<{ id: string }>
      ).map((child) => child.id),
      parentIds: mandala.linkedTo ? [mandala.linkedTo.id] : [],
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
          linkedToId: createMandalaDto.parentId,
        }),
      },
      include: {
        linkedMandalas: { select: { id: true } },
        linkedTo: { select: { id: true } },
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
          linkedMandalas: { select: { id: true } },
          linkedTo: { select: { id: true } },
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
        linkedMandalas: { select: { id: true } },
        linkedTo: { select: { id: true } },
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
        linkedMandalas: { select: { id: true } },
        linkedTo: { select: { id: true } },
      },
    });

    return this.parseToMandalaDto(mandala);
  }

  async remove(id: string): Promise<MandalaDto> {
    const mandala = await this.prisma.mandala.delete({
      where: { id },
      include: {
        linkedMandalas: { select: { id: true } },
        linkedTo: { select: { id: true } },
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
        linkedToId: null,
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
        linkedMandalas: true,
      },
    });

    if (!mandala || !mandala.linkedMandalas) {
      return [];
    }

    const linkedChildren = mandala.linkedMandalas as Array<{
      id: string;
      configuration: Prisma.JsonValue;
    }>;

    return linkedChildren.map((childMandala) => {
      const configuration = this.parseToMandalaConfiguration(
        childMandala.configuration,
      );
      return {
        id: childMandala.id,
        ...configuration.center,
      } as MandalaCenter;
    });
  }

  async linkMandala(parentId: string, childId: string): Promise<MandalaDto> {
    const mandala = await this.prisma.mandala.update({
      where: { id: parentId },
      data: {
        linkedMandalas: {
          connect: { id: childId },
        },
      },
      include: {
        linkedMandalas: { select: { id: true } },
        linkedTo: { select: { id: true } },
      },
    });

    return this.parseToMandalaDto(mandala);
  }

  async unlinkMandala(parentId: string, childId: string): Promise<MandalaDto> {
    const mandala = await this.prisma.mandala.update({
      where: { id: parentId },
      data: {
        linkedMandalas: {
          disconnect: { id: childId },
        },
      },
      include: {
        linkedMandalas: { select: { id: true } },
        linkedTo: { select: { id: true } },
      },
    });

    return this.parseToMandalaDto(mandala);
  }

  async findCharacterList(
    projectId: string,
  ): Promise<{ id: string; name: string; color: string }[]> {
    const mandalas = await this.prisma.mandala.findMany({
      where: {
        projectId,
        linkedToId: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        configuration: true,
      },
    });

    return mandalas.map((m) => {
      const config = this.parseToMandalaConfiguration(m.configuration);
      return {
        id: m.id,
        name: m.name,
        color: config.center.color,
      } as { id: string; name: string; color: string };
    });
  }
}
