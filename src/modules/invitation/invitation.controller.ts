import { RequireOwner } from '@common/guards/owner.guard';
import { EnumValidationPipe } from '@common/pipes/enum-validation.pipe';
import { MaxValuePipe } from '@common/pipes/max-value.pipe';
import { MinValuePipe } from '@common/pipes/min-value.pipe';
import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';
import {
  MessageResponse,
  PaginatedResponse,
  DataResponse,
  MessageOnlyResponse,
} from '@common/types/responses';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { RequestWithUser } from '@modules/auth/types/auth.types';
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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';

import {
  ApiCreateInvitation,
  ApiGetAllInvitations,
  ApiGetInvitationsByProject,
  ApiGetInvitation,
  ApiAcceptInvitation,
  ApiRejectInvitation,
  ApiDeleteInvitation,
} from './decorators/invitation-swagger.decorators';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationDto } from './dto/invitation.dto';
import {
  InvitationAccessGuard,
  RequireInvitationAccess,
} from './guards/invitation-access.guard';
import { InvitationRoleGuard } from './guards/invitation-role.guard';
import { InvitationService } from './invitation.service';

@ApiTags('Invitations')
@Controller('invitation')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard, InvitationRoleGuard)
  @RequireOwner()
  @ApiBearerAuth()
  @ApiCreateInvitation()
  async create(
    @Body() createInvitationDto: CreateInvitationDto,
    @Request() req: RequestWithUser,
  ): Promise<MessageResponse<InvitationDto>> {
    const invitation = await this.invitationService.create(
      createInvitationDto,
      req.user.id,
    );
    return {
      message: 'Invitation sent successfully',
      data: invitation,
    };
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiGetAllInvitations()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query(
      'limit',
      new DefaultValuePipe(10),
      ParseIntPipe,
      new MinValuePipe(1),
      new MaxValuePipe(100),
    )
    limit: number,
    @Query('projectId', new UuidValidationPipe()) projectId?: string,
    @Query('status', new EnumValidationPipe(InvitationStatus))
    status?: InvitationStatus,
  ): Promise<PaginatedResponse<InvitationDto>> {
    return await this.invitationService.findAllPaginated(
      page,
      limit,
      projectId,
      status,
    );
  }

  @Get('project/:projectId')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiGetInvitationsByProject()
  async findByProject(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query(
      'limit',
      new DefaultValuePipe(10),
      ParseIntPipe,
      new MinValuePipe(1),
      new MaxValuePipe(100),
    )
    limit: number,
  ): Promise<PaginatedResponse<InvitationDto>> {
    return await this.invitationService.findByProject(projectId, page, limit);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiGetInvitation()
  async findOne(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<DataResponse<InvitationDto>> {
    const invitation = await this.invitationService.findOne(id);
    return { data: invitation };
  }

  @Post(':id/accept')
  @UseGuards(FirebaseAuthGuard, InvitationAccessGuard)
  @RequireInvitationAccess('recipient')
  @ApiBearerAuth()
  @ApiAcceptInvitation()
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
  @UseGuards(FirebaseAuthGuard, InvitationAccessGuard)
  @RequireInvitationAccess('recipient')
  @ApiBearerAuth()
  @ApiRejectInvitation()
  async reject(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<MessageResponse<InvitationDto>> {
    const invitation = await this.invitationService.reject(id);
    return {
      message: 'Invitation rejected successfully',
      data: invitation,
    };
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, InvitationAccessGuard)
  @RequireInvitationAccess('sender', 'recipient')
  @ApiBearerAuth()
  @ApiDeleteInvitation()
  async remove(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<MessageOnlyResponse> {
    await this.invitationService.remove(id);
    return { message: 'Invitation deleted successfully' };
  }

  @Post('create-link')
  @UseGuards(FirebaseAuthGuard, InvitationRoleGuard)
  @RequireOwner()
  @ApiBearerAuth()
  async createInviteLink(
    @Body()
    createLinkDto: {
      projectId: string;
      role: string;
      organizationId: string;
      expiresAt?: Date;
      email?: string;
      sendEmail?: boolean;
    },
    @Request() req: RequestWithUser,
  ): Promise<MessageResponse<{ inviteUrl: string; token: string }>> {
    const invitation = await this.invitationService.createInviteLink(
      createLinkDto.projectId,
      createLinkDto.role,
      req.user.id,
      createLinkDto.expiresAt,
      createLinkDto.email,
      createLinkDto.sendEmail,
    );

    const inviteUrl = `${process.env.FRONTEND_BASE_URL}/invite/${invitation.inviteToken}?org=${createLinkDto.organizationId}&project=${createLinkDto.projectId}`;

    return {
      message: createLinkDto.sendEmail
        ? 'Invitation sent successfully'
        : 'Invite link created successfully',
      data: { inviteUrl, token: invitation.inviteToken },
    };
  }

  @Get('join/:token')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  async joinByToken(
    @Param('token') token: string,
    @Request() req: RequestWithUser,
  ): Promise<MessageResponse<{ projectId: string; organizationId?: string }>> {
    const result = await this.invitationService.acceptByToken(
      token,
      req.user.id,
    );
    return {
      message: 'Successfully joined project',
      data: {
        projectId: result.projectId,
        organizationId: result.organizationId,
      },
    };
  }
}
