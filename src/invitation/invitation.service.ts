import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Invitation } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationRepository } from './invitation.repository';
import { InvitationStatus } from '@prisma/client';
import { InvitationDto } from './dto/invitation.dto';

@Injectable()
export class InvitationService {
  constructor(private invitationRepository: InvitationRepository) {}

  async create(
    createInvitationDto: CreateInvitationDto,
  ): Promise<InvitationDto> {
    const existingInvitation = await this.invitationRepository.findByEmail(
      createInvitationDto.email,
      createInvitationDto.projectId,
    );

    if (existingInvitation) {
      throw new ConflictException(
        'An invitation for this email already exists in this project',
      );
    }

    // Validate project exists
    const project = await this.invitationRepository.findProjectById(
      createInvitationDto.projectId,
    );

    if (!project) {
      throw new NotFoundException(
        `Project with ID ${createInvitationDto.projectId} does not exist`,
      );
    }

    // Validate inviter exists
    const inviter = await this.invitationRepository.findUserById(
      createInvitationDto.invitedById,
    );

    if (!inviter) {
      throw new NotFoundException(
        `User with ID ${createInvitationDto.invitedById} does not exist`,
      );
    }

    const invitation = await this.invitationRepository.create(
      createInvitationDto.email,
      createInvitationDto.projectId,
      createInvitationDto.invitedById,
    );

    return this.mapToInvitationDto(invitation);
  }

  async findAllPaginated(
    page: number,
    limit: number,
    projectId?: string,
    status?: InvitationStatus,
  ) {
    const skip = (page - 1) * limit;
    const [invitations, total] =
      await this.invitationRepository.findAllPaginated(
        skip,
        limit,
        projectId,
        status,
      );

    return {
      data: invitations.map((inv) => this.mapToInvitationDto(inv)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByProject(projectId: string, page: number, limit: number) {
    return await this.findAllPaginated(page, limit, projectId);
  }

  async findOne(id: string): Promise<InvitationDto> {
    const invitation = await this.invitationRepository.findById(id);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return this.mapToInvitationDto(invitation);
  }

  async remove(id: string): Promise<void> {
    const invitation = await this.findOne(id);
    await this.invitationRepository.delete(invitation.id);
  }

  async accept(id: string, userId: string): Promise<InvitationDto> {
    const invitation = await this.findOne(id);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Can only accept pending invitations');
    }

    const memberRole =
      await this.invitationRepository.findOrCreateRole('member');

    const updatedInvitation =
      await this.invitationRepository.acceptInvitationAndAddUser(
        id,
        userId,
        memberRole.id,
      );

    if (!updatedInvitation) {
      throw new NotFoundException('Failed to update invitation');
    }

    return this.mapToInvitationDto(updatedInvitation);
  }

  async reject(id: string): Promise<InvitationDto> {
    const invitation = await this.findOne(id);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Can only reject pending invitations');
    }

    const updatedInvitation = await this.invitationRepository.update(
      id,
      InvitationStatus.REJECTED,
    );

    if (!updatedInvitation) {
      throw new NotFoundException('Failed to update invitation');
    }

    return this.mapToInvitationDto(updatedInvitation);
  }

  private mapToInvitationDto(invitation: Invitation): InvitationDto {
    return {
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      projectId: invitation.projectId,
    };
  }
}
