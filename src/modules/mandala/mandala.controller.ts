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
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { MandalaDto } from './dto/mandala.dto';
import {
  MessageResponse,
  DataResponse,
  PaginatedResponse,
} from '@common/types/responses';
import { MinValuePipe } from '@common/pipes/min-value.pipe';
import { MandalaWithPostitsAndLinkedCentersDto } from './dto/mandala-with-postits-and-linked-centers.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FilterSectionDto } from './dto/filter-option.dto';

@ApiTags('Mandalas')
@Controller('mandala')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class MandalaController {
  constructor(private readonly mandalaService: MandalaService) {}

  @Post()
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

  @Get('filter-options')
  @ApiOperation({
    summary: 'Obtener filtros configurables para un mandala',
    description:
      'Retorna todas las opciones de filtros disponibles para construir dinámicamente un menú de selección (dimensiones, escalas y tags) basado en el mandala especificado',
  })
  @ApiQuery({
    name: 'id',
    required: true,
    description:
      'ID del mandala para obtener dimensiones, escalas y tags del proyecto asociado',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna las secciones de filtros configurables',
    type: [FilterSectionDto],
  })
  @ApiResponse({ status: 404, description: 'Mandala no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'No tiene acceso al proyecto del mandala',
  })
  async getFilters(
    @Query('id') id: string,
  ): Promise<DataResponse<FilterSectionDto[]>> {
    const filters = await this.mandalaService.getFilters(id);
    return {
      data: filters,
    };
  }

  @Get(':id')
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
  @ApiOperation({
    summary: 'Generar un mandala automáticamente con IA',
    description:
      'Crea un nuevo mandala con post-its generados automáticamente usando ia.',
  })
  @ApiResponse({
    status: 201,
    description: 'Se generó un nuevo mandala automáticamente con sus post-its',
    type: MandalaWithPostitsAndLinkedCentersDto,
  })
  async generate(
    @Body() createMandalaDto: CreateMandalaDto,
  ): Promise<MessageResponse<MandalaWithPostitsAndLinkedCentersDto>> {
    const mandalaWithPostits =
      await this.mandalaService.generate(createMandalaDto);
    return {
      message: 'Mandala generated successfully with IA',
      data: mandalaWithPostits,
    };
  }
}
