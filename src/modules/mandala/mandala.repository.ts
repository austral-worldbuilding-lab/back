import { CreateMandalaDto } from '@modules/mandala/dto/create-mandala.dto';
import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CharacterListItemDto } from './dto/character-list-item.dto';
import { MandalaDto, MandalaCharacterDto } from './dto/mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { CreateMandalaConfiguration } from './types/mandala-configuration.type';
import { MandalaType } from './types/mandala-type.enum';

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

  private parseConfigurationToJson(
    config: CreateMandalaConfiguration,
  ): Prisma.InputJsonValue {
    const configuration = {
      center: {
        name: config.center.name,
        description: config.center.description,
        color: config.center.color,
        characters: config.center.characters || [],
      },
      dimensions: config.dimensions.map((dim) => ({
        name: dim.name,
        color: dim.color,
      })),
      scales: config.scales,
    };

    return configuration as unknown as Prisma.InputJsonValue;
  }

  private parseToMandalaDto(mandala: MandalaWithRelations): MandalaDto {
    const configuration = this.parseToMandalaConfiguration(
      mandala.configuration,
    );

    const parentIds = mandala.parent?.map((parent) => parent.id) || [];
    const type = mandala.type as MandalaType;

    // Para mandalas unificadas, obtener personajes
    let characters: MandalaCharacterDto[] = [];
    if (
      (type === MandalaType.OVERLAP || type === MandalaType.OVERLAP_SUMMARY) &&
      configuration.center.characters
    ) {
      characters = configuration.center.characters.map((character) => ({
        id: character.id,
        name: character.name,
        color: character.color,
      }));
    }

    return {
      id: mandala.id,
      name: mandala.name,
      type,
      projectId: mandala.projectId,
      configuration: {
        center: configuration.center,
        dimensions: configuration.dimensions,
        scales: configuration.scales,
      },
      childrenIds: mandala.children?.map((child) => child.id) || [],
      parentIds,
      createdAt: mandala.createdAt,
      updatedAt: mandala.updatedAt,
      characters, // Siempre array, nunca undefined
    };
  }

  async create(
    createMandalaDto: CreateMandalaDto,
    type: MandalaType,
  ): Promise<MandalaDto> {
    const configuration: CreateMandalaConfiguration = {
      center: createMandalaDto.center,
      dimensions: createMandalaDto.dimensions!,
      scales: createMandalaDto.scales!,
    };

    const mandala = await this.prisma.mandala.create({
      data: {
        name: createMandalaDto.name,
        projectId: createMandalaDto.projectId,
        type: type,
        configuration: this.parseConfigurationToJson(configuration),
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

    return this.parseToMandalaDto(mandala as MandalaWithRelations);
  }

  async findAll(projectId: string): Promise<MandalaDto[]> {
    const mandalas = await this.prisma.mandala.findMany({
      where: {
        projectId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        children: { select: { id: true } },
        parent: { select: { id: true } },
      },
    });

    return mandalas.map((m) => this.parseToMandalaDto(m));
  }

  async findAllPaginated(
    projectId: string,
    skip: number,
    take: number,
  ): Promise<[MandalaDto[], number]> {
    const where = {
      projectId,
      isActive: true,
    };
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
    const mandala = await this.prisma.mandala.findFirst({
      where: {
        id,
        isActive: true,
      },
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
    const updateData: {
      name: string;
      configuration?: Prisma.InputJsonValue;
    } = {
      name: updateMandalaDto.name,
    };

    if (updateMandalaDto.description !== undefined) {
      const currentMandala = await this.prisma.mandala.findUnique({
        where: { id },
      });

      if (!currentMandala) {
        throw new Error('Mandala not found');
      }

      const currentConfig = this.parseToMandalaConfiguration(
        currentMandala.configuration,
      );
      const updatedConfig = {
        ...currentConfig,
        center: {
          ...currentConfig.center,
          description: updateMandalaDto.description,
        },
      };

      updateData.configuration = this.parseConfigurationToJson(updatedConfig);
    }

    const mandala = await this.prisma.mandala.update({
      where: { id },
      data: updateData,
      include: {
        children: { select: { id: true } },
        parent: { select: { id: true } },
      },
    });

    return this.parseToMandalaDto(mandala);
  }

  async remove(id: string): Promise<MandalaDto> {
    const mandala = await this.prisma.mandala.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
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
        isActive: true,
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

  /**
   * Finds all child mandalas of a given parent mandala and returns their center information.
   * This is used to populate the characters field in Firestore documents with the centers
   * of all linked child mandalas, maintaining the hierarchical relationship in the UI.
   *
   * @param mandalaId - The ID of the parent mandala
   * @returns Array of MandalaCenter objects from all child mandalas
   */
  async findChildrenMandalasCenters(
    mandalaId: string,
  ): Promise<MandalaCenter[]> {
    const mandala = await this.prisma.mandala.findFirst({
      where: {
        id: mandalaId,
        isActive: true,
      },
      include: {
        children: {
          where: { isActive: true },
        },
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
      where: {
        projectId,
        isActive: true,
      },
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

  async findMandalaWithProjectInfo(mandalaId: string): Promise<{
    projectId: string;
    organizationId: string;
  } | null> {
    const mandala = await this.prisma.mandala.findFirst({
      where: {
        id: mandalaId,
        isActive: true,
      },
      select: {
        projectId: true,
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!mandala || !mandala.project?.organizationId) {
      return null;
    }

    return {
      projectId: mandala.projectId,
      organizationId: mandala.project.organizationId,
    };
  }
}
