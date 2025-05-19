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
import { FirebaseAuthGuard } from '../auth/firebase/firebase.guard';
import { InvitationStatus } from '@prisma/client';
import { MinValuePipe } from '../pipes/min-value.pipe';
import {
  MessageResponse,
  PaginatedResponse,
  DataResponse,
} from '../common/types/responses';
import { RequestWithUser } from '../auth/types/auth.types';

@Controller('invitation')
@UseGuards(FirebaseAuthGuard)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
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
  async findOne(@Param('id') id: string): Promise<DataResponse<InvitationDto>> {
    const invitation = await this.invitationService.findOne(id);
    return { data: invitation };
  }

  @Post(':id/accept')
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
  async remove(@Param('id') id: string): Promise<void> {
    await this.invitationService.remove(id);
  }
}
