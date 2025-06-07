import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateMandalaDto } from './dto/create-mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { MandalaDto } from './dto/mandala.dto';

@Injectable()
export class MandalaRepository {
  constructor(private prisma: PrismaService) {}

  async create(createMandalaDto: CreateMandalaDto): Promise<MandalaDto> {
    return this.prisma.mandala.create({
      data: {
        name: createMandalaDto.name,
        projectId: createMandalaDto.projectId,
        dimensions: {
          create: createMandalaDto.dimensions!.map((dim) => ({
            name: dim.name,
            color: dim.color,
          })),
        },
        scales: createMandalaDto.scales,
      },
      include: {
        dimensions: true,
      },
    });
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
          dimensions: true,
        },
      }),
      this.prisma.mandala.count({ where }),
    ]);

    return [mandalas, total];
  }

  async findOne(id: string): Promise<MandalaDto | null> {
    return this.prisma.mandala.findFirst({
      where: { id },
      include: {
        dimensions: true,
      },
    });
  }

  async update(
    id: string,
    updateMandalaDto: UpdateMandalaDto,
  ): Promise<MandalaDto> {
    return this.prisma.mandala.update({
      where: { id },
      data: {
        ...(updateMandalaDto.name && { name: updateMandalaDto.name }),
        ...(updateMandalaDto.dimensions && {
          dimensions: {
            deleteMany: {},
            create: updateMandalaDto.dimensions.map((dim) => ({
              name: dim.name,
              color: dim.color,
            })),
          },
        }),
        ...(updateMandalaDto.scales && { scales: updateMandalaDto.scales }),
      },
      include: {
        dimensions: true,
      },
    });
  }

  async remove(id: string): Promise<MandalaDto> {
    return this.prisma.mandala.delete({
      where: { id },
      include: {
        dimensions: true,
      },
    });
  }
}
