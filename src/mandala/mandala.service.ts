import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMandalaDto } from './dto/create-mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';

@Injectable()
export class MandalaService {
  constructor(private prisma: PrismaService) {}

  async create(createMandalaDto: CreateMandalaDto) {
    return this.prisma.mandala.create({
      data: createMandalaDto,
    });
  }

  async findAll() {
    return this.prisma.mandala.findMany();
  }

  async findOne(id: string) {
    const mandala = await this.prisma.mandala.findUnique({
      where: { id },
    });

    if (!mandala) {
      throw new NotFoundException(`Mandala with ID ${id} not found`);
    }

    return mandala;
  }

  async update(id: string, updateMandalaDto: UpdateMandalaDto) {
    try {
      return await this.prisma.mandala.update({
        where: { id },
        data: updateMandalaDto,
      });
    } catch (_error) {
      throw new NotFoundException(`Mandala with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.mandala.delete({
        where: { id },
      });
    } catch (_error) {
      throw new NotFoundException(`Mandala with ID ${id} not found`);
    }
  }
}
