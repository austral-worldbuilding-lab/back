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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Mandalas')
@Controller('mandala')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class MandalaController {
  constructor(private readonly mandalaService: MandalaService) {}

  @Post()
  @UseGuards(ProjectRoleGuard)
  @AllowedRoles('owner', 'member')
  @ApiOperation({ summary: 'Crear un nuevo mandala' })
  @ApiResponse({
    status: 201,
    description: 'El mandala ha sido creado exitosamente',
    type: MandalaDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No tiene permisos suficientes',
  })
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
  @ApiOperation({ summary: 'Obtener todos los mandalas de un proyecto' })
  @ApiQuery({
    name: 'projectId',
    required: true,
    description: 'ID del proyecto',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    description: 'Número de página',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Elementos por página',
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna una lista paginada de mandalas',
    type: [MandalaDto],
  })
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
  @ApiOperation({ summary: 'Obtener un mandala por ID' })
  @ApiParam({ name: 'id', description: 'ID del mandala', type: String })
  @ApiResponse({
    status: 200,
    description: 'Retorna el mandala con el ID especificado',
    type: MandalaDto,
  })
  @ApiResponse({ status: 404, description: 'Mandala no encontrado' })
  async findOne(@Param('id') id: string): Promise<DataResponse<MandalaDto>> {
    const mandala = await this.mandalaService.findOne(id);
    return {
      data: mandala,
    };
  }

  @Patch(':id')
  @UseGuards(ProjectRoleGuard)
  @AllowedRoles('owner', 'member')
  @ApiOperation({ summary: 'Actualizar un mandala' })
  @ApiParam({ name: 'id', description: 'ID del mandala', type: String })
  @ApiResponse({
    status: 200,
    description: 'El mandala ha sido actualizado exitosamente',
    type: MandalaDto,
  })
  @ApiResponse({ status: 404, description: 'Mandala no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No tiene permisos suficientes',
  })
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
  @ApiOperation({ summary: 'Eliminar un mandala' })
  @ApiParam({ name: 'id', description: 'ID del mandala', type: String })
  @ApiResponse({
    status: 200,
    description: 'El mandala ha sido eliminado exitosamente',
    type: MandalaDto,
  })
  @ApiResponse({ status: 404, description: 'Mandala no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - Solo el propietario puede eliminar mandalas',
  })
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
  @ApiOperation({ summary: 'Generar un mandala automáticamente con IA' })
  @ApiResponse({
    status: 201,
    description: 'Se generó un nuevo mandala automáticamente',
    type: MandalaWithPostitsDto,
  })
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
