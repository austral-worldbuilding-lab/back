import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMandalaDto } from './dto/create-mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { MandalaRepository } from './mandala.repository';
import { MandalaDto } from './dto/mandala.dto';
import { PaginatedResponse } from '../common/types/responses';

@Injectable()
export class MandalaService {
  constructor(private mandalaRepository: MandalaRepository) {}

  async create(createMandalaDto: CreateMandalaDto): Promise<MandalaDto> {
    return this.mandalaRepository.create(createMandalaDto);
  }

  async findAllPaginated(
    projectId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<MandalaDto>> {
    const skip = (page - 1) * limit;
    const [mandalas, total] = await this.mandalaRepository.findAllPaginated(
      projectId,
      skip,
      limit,
    );

    return {
      data: mandalas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<MandalaDto> {
    const mandala = await this.mandalaRepository.findOne(id);
    if (!mandala) {
      throw new NotFoundException(`Mandala with ID ${id} not found`);
    }
    return mandala;
  }

  async update(
    id: string,
    updateMandalaDto: UpdateMandalaDto,
  ): Promise<MandalaDto> {
    return this.mandalaRepository.update(id, updateMandalaDto);
  }

  async remove(id: string): Promise<MandalaDto> {
    return this.mandalaRepository.remove(id);
  }

  generate() {
    //por ahora se simula que creamos la mandala
    return {
      message: 'Mandala generated successfully',
    };
  }
}
