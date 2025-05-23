import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { MandalaService } from './mandala.service';
import { CreateMandalaDto } from './dto/create-mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { ProjectRoleGuard, AllowedRoles } from './guards/project-role.guard';
import { ProjectParticipantGuard } from './guards/project-participant.guard';
import { FirebaseAuthGuard } from '../auth/firebase/firebase.guard';
import { MandalaDto } from './dto/mandala.dto';
import {
  MessageResponse,
  DataResponse,
  PaginatedResponse,
} from '../common/types/responses';
import { MinValuePipe } from '../pipes/min-value.pipe';
import { MandalaWithPostitsDto } from './dto/mandala-with-postits.dto';

@Controller('mandala')
@UseGuards(FirebaseAuthGuard)
export class MandalaController {
  constructor(private readonly mandalaService: MandalaService) {}

  @Post()
  @UseGuards(ProjectRoleGuard)
  @AllowedRoles('owner', 'member')
  async create(
    @Body() createMandalaDto: CreateMandalaDto,
  ): Promise<MessageResponse<MandalaDto>> {
    const mandala = await this.mandalaService.create(createMandalaDto);
    return {
      message: 'Mandala created successfully',
      data: mandala,
    };
  }

  @Get()
  @UseGuards(ProjectParticipantGuard)
  async findAll(
    @Query('projectId') projectId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe, new MinValuePipe(1))
    limit: number,
  ): Promise<PaginatedResponse<MandalaDto>> {
    return await this.mandalaService.findAllPaginated(projectId, page, limit);
  }

  @Get(':id')
  @UseGuards(ProjectParticipantGuard)
  async findOne(@Param('id') id: string): Promise<DataResponse<MandalaDto>> {
    const mandala = await this.mandalaService.findOne(id);
    return {
      data: mandala,
    };
  }

  @Patch(':id')
  @UseGuards(ProjectRoleGuard)
  @AllowedRoles('owner', 'member')
  async update(
    @Param('id') id: string,
    @Body() updateMandalaDto: UpdateMandalaDto,
  ): Promise<MessageResponse<MandalaDto>> {
    const mandala = await this.mandalaService.update(id, updateMandalaDto);
    return {
      message: 'Mandala updated successfully',
      data: mandala,
    };
  }

  @Delete(':id')
  @UseGuards(ProjectRoleGuard)
  @AllowedRoles('owner')
  async remove(@Param('id') id: string): Promise<MessageResponse<MandalaDto>> {
    const mandala = await this.mandalaService.remove(id);
    return {
      message: 'Mandala deleted successfully',
      data: mandala,
    };
  }

  @Post('generate')
  @UseGuards(ProjectRoleGuard)
  @AllowedRoles('owner', 'member')
  async generate(
    @Body() createMandalaDto: CreateMandalaDto,
  ): Promise<MessageResponse<MandalaWithPostitsDto>> {
    const mandalaWithPostits =
      await this.mandalaService.generate(createMandalaDto);
    return {
      message: 'Mandala generated successfully with IA',
      data: mandalaWithPostits,
    };
  }
}
