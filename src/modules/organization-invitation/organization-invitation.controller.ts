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
  ApiCreateOrgInvitation,
  ApiGetAllOrgInvitations,
  ApiGetOrgInvitationsByOrganization,
  ApiGetOrgInvitation,
  ApiAcceptOrgInvitation,
  ApiRejectOrgInvitation,
  ApiDeleteOrgInvitation,
} from './decorators/organization-invitation-swagger.decorators';
import { CreateOrganizationInvitationDto } from './dto/create-organization-invitation.dto';
import { OrganizationInvitationDto } from './dto/organization-invitation.dto';
import {
  OrganizationInvitationAccessGuard,
  RequireOrgInvitationAccess,
} from './guards/organization-invitation-access.guard';
import { OrganizationInvitationRoleGuard } from './guards/organization-invitation-role.guard';
import { OrganizationInvitationService } from './organization-invitation.service';

import { RequireOrganizationRoles } from '@/common/guards/base-organization-role.guard';

@ApiTags('Organization Invitations')
@Controller('organization-invitation')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class OrganizationInvitationController {
  constructor(
    private readonly invitationService: OrganizationInvitationService,
  ) {}

  @Post()
  @UseGuards(OrganizationInvitationRoleGuard)
  @RequireOrganizationRoles('dueño', 'facilitador')
  @ApiCreateOrgInvitation()
  async create(
    @Body() dto: CreateOrganizationInvitationDto,
    @Request() req: RequestWithUser,
  ): Promise<MessageResponse<OrganizationInvitationDto>> {
    const invitation = await this.invitationService.create(dto, req.user.id);
    return {
      message: 'Organization invitation sent successfully',
      data: invitation,
    };
  }

  @Get()
  @ApiGetAllOrgInvitations()
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
    @Query('organizationId', new UuidValidationPipe()) organizationId?: string,
    @Query('status', new EnumValidationPipe(InvitationStatus))
    status?: InvitationStatus,
  ): Promise<PaginatedResponse<OrganizationInvitationDto>> {
    return this.invitationService.findAllPaginated(
      page,
      limit,
      organizationId,
      status,
    );
  }

  @Get('organization/:organizationId')
  @ApiGetOrgInvitationsByOrganization()
  async findByOrganization(
    @Param('organizationId', new UuidValidationPipe()) organizationId: string,
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
  ): Promise<PaginatedResponse<OrganizationInvitationDto>> {
    return this.invitationService.findByOrganization(
      organizationId,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiGetOrgInvitation()
  async findOne(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<DataResponse<OrganizationInvitationDto>> {
    const invitation = await this.invitationService.findOne(id);
    return { data: invitation };
  }

  @Post(':id/accept')
  @UseGuards(OrganizationInvitationAccessGuard)
  @RequireOrgInvitationAccess('recipient')
  @ApiAcceptOrgInvitation()
  async accept(
    @Param('id', new UuidValidationPipe()) id: string,
    @Request() req: RequestWithUser,
  ): Promise<MessageResponse<OrganizationInvitationDto>> {
    const invitation = await this.invitationService.accept(id, req.user.id);
    return {
      message: 'Organization invitation accepted successfully',
      data: invitation,
    };
  }

  @Post(':id/reject')
  @UseGuards(OrganizationInvitationAccessGuard)
  @RequireOrgInvitationAccess('recipient')
  @ApiRejectOrgInvitation()
  async reject(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<MessageResponse<OrganizationInvitationDto>> {
    const invitation = await this.invitationService.reject(id);
    return {
      message: 'Organization invitation rejected successfully',
      data: invitation,
    };
  }

  @Delete(':id')
  @UseGuards(OrganizationInvitationAccessGuard)
  @RequireOrgInvitationAccess('sender', 'recipient')
  @ApiDeleteOrgInvitation()
  async remove(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<MessageOnlyResponse> {
    await this.invitationService.remove(id);
    return { message: 'Organization invitation deleted successfully' };
  }

  @Post('create-link')
  @UseGuards(OrganizationInvitationRoleGuard)
  @RequireOrganizationRoles('dueño', 'facilitador')
  async createInviteLink(
    @Body()
    createLinkDto: {
      organizationId: string;
      role: string;
      expiresAt?: Date;
      email?: string;
      sendEmail?: boolean;
    },
    @Request() req: RequestWithUser,
  ): Promise<MessageResponse<{ inviteUrl: string; token: string }>> {
    const invitation = await this.invitationService.createInviteLink(
      createLinkDto.organizationId,
      createLinkDto.role,
      req.user.id,
      createLinkDto.expiresAt,
      createLinkDto.email,
      createLinkDto.sendEmail,
    );

    const inviteUrl = `${process.env.FRONTEND_BASE_URL}/organization-invite/${invitation.inviteToken}?org=${createLinkDto.organizationId}`;

    return {
      message: createLinkDto.sendEmail
        ? 'Organization invitation sent successfully'
        : 'Organization invite link created successfully',
      data: { inviteUrl, token: invitation.inviteToken },
    };
  }

  @Get('join/:token')
  async joinByToken(
    @Param('token') token: string,
    @Request() req: RequestWithUser,
  ): Promise<MessageResponse<{ organizationId: string }>> {
    const result = await this.invitationService.acceptByToken(
      token,
      req.user.id,
    );
    return {
      message: 'Successfully joined organization',
      data: {
        organizationId: result.organizationId,
      },
    };
  }
}
