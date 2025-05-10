import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMandalaDto } from './dto/create-mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';

@Injectable()
export class MandalaService {
  constructor(private prisma: PrismaService) {}

  async create(createMandalaDto: CreateMandalaDto) {
    const mandala = await this.prisma.mandala.create({
      data: {
        name: createMandalaDto.name,
        projectId: createMandalaDto.projectId,
      },
    });

    return {
      message: 'Mandala created successfully',
      data: mandala,
    };
  }

  async findAll(projectId: string) {
    const mandalas = await this.prisma.mandala.findMany({
      where: { projectId },
    });

    return {
      data: mandalas,
    };
  }

  async findOne(id: string) {
    const mandala = await this.prisma.mandala.findFirst({
      where: { id },
    });

    if (!mandala) {
      throw new NotFoundException(`Mandala with ID ${id} not found`);
    }

    return {
      data: mandala,
    };
  }

  async update(id: string, updateMandalaDto: UpdateMandalaDto) {
    const mandala = await this.prisma.mandala.update({
      where: { id },
      data: {
        name: updateMandalaDto.name,
      },
    });

    return {
      message: 'Mandala updated successfully',
      data: mandala,
    };
  }

  async remove(id: string) {
    await this.prisma.mandala.delete({
      where: { id },
    });

    return {
      message: 'Mandala deleted successfully',
    };
  }
}
