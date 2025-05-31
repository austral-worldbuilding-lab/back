import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationDto } from './dto/invitation.dto';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { InvitationStatus } from '@prisma/client';
import { MinValuePipe } from '@common/pipes/min-value.pipe';
import {
  MessageResponse,
  PaginatedResponse,
  DataResponse,
} from '@common/types/responses';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Invitations')
@Controller('invitation')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva invitación' })
  @ApiResponse({
    status: 201,
    description: 'La invitación ha sido enviada exitosamente',
    type: InvitationDto,
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta' })
  async create(
    @Body() createInvitationDto: CreateInvitationDto,
  ): Promise<MessageResponse<InvitationDto>> {
    const invitation = await this.invitationService.create(createInvitationDto);
    return {
      message: 'Invitation sent successfully',
      data: invitation,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las invitaciones con filtros opcionales',
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
  @ApiQuery({
    name: 'projectId',
    description: 'ID del proyecto (opcional)',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Estado de la invitación (opcional)',
    enum: InvitationStatus,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna una lista paginada de invitaciones',
    type: [InvitationDto],
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe, new MinValuePipe(1))
    limit: number,
    @Query('projectId') projectId?: string,
    @Query('status') status?: InvitationStatus,
  ): Promise<PaginatedResponse<InvitationDto>> {
    return await this.invitationService.findAllPaginated(
      page,
      limit,
      projectId,
      status,
    );
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Obtener invitaciones por proyecto' })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto', type: String })
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
    description: 'Retorna una lista paginada de invitaciones del proyecto',
    type: [InvitationDto],
  })
  async findByProject(
    @Param('projectId') projectId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe, new MinValuePipe(1))
    limit: number,
  ): Promise<PaginatedResponse<InvitationDto>> {
    return await this.invitationService.findByProject(projectId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una invitación por ID' })
  @ApiParam({ name: 'id', description: 'ID de la invitación', type: String })
  @ApiResponse({
    status: 200,
    type: InvitationDto,
  })
  @ApiResponse({ status: 404, description: 'Invitación no encontrada' })
  async findOne(@Param('id') id: string): Promise<DataResponse<InvitationDto>> {
    const invitation = await this.invitationService.findOne(id);
    return { data: invitation };
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Aceptar una invitación' })
  @ApiParam({ name: 'id', description: 'ID de la invitación', type: String })
  @ApiResponse({
    status: 200,
    description: 'La invitación ha sido aceptada exitosamente',
    type: InvitationDto,
  })
  @ApiResponse({ status: 404, description: 'Invitación no encontrada' })
  async accept(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<MessageResponse<InvitationDto>> {
    const invitation = await this.invitationService.accept(id, req.user.id);
    return {
      message: 'Invitation accepted successfully',
      data: invitation,
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rechazar una invitación' })
  @ApiParam({ name: 'id', description: 'ID de la invitación', type: String })
  @ApiResponse({
    status: 200,
    description: 'La invitación ha sido rechazada exitosamente',
    type: InvitationDto,
  })
  @ApiResponse({ status: 404, description: 'Invitación no encontrada' })
  async reject(
    @Param('id') id: string,
  ): Promise<MessageResponse<InvitationDto>> {
    const invitation = await this.invitationService.reject(id);
    return {
      message: 'Invitation rejected successfully',
      data: invitation,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una invitación' })
  @ApiParam({ name: 'id', description: 'ID de la invitación', type: String })
  @ApiResponse({
    status: 200,
    description: 'La invitación ha sido eliminada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Invitación no encontrada' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.invitationService.remove(id);
  }
}
