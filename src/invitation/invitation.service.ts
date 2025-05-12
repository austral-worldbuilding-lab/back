import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationRepository } from './invitation.repository';

@Injectable()
export class InvitationService {
  constructor(
    private invitationRepository: InvitationRepository,
  ) {}

  async create(createInvitationDto: CreateInvitationDto): Promise<Invitation> {
    const existingInvitation = await this.invitationRepository.findByEmail(createInvitationDto.email);

    if (existingInvitation) {
      throw new ConflictException('An invitation for this email already exists');
    }

    return this.invitationRepository.create(
      createInvitationDto.email,
      createInvitationDto.projectId,
      createInvitationDto.invitedById
    );
  }

  async findAll(): Promise<Invitation[]> {
    return this.invitationRepository.findAll();
  }

  async findOne(id: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.findById(id);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  async resend(id: string): Promise<Invitation> {
    const invitation = await this.findOne(id);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Can only resend pending invitations');
    }

    return invitation;
  }

  async remove(id: string): Promise<void> {
    const invitation = await this.findOne(id);
    await this.invitationRepository.delete(id);
  }

  async accept(id: string): Promise<Invitation> {
    const invitation = await this.findOne(id);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Can only accept pending invitations');
    }

    const updatedInvitation = await this.invitationRepository.update(id, InvitationStatus.ACCEPTED);
    if (!updatedInvitation) {
      throw new NotFoundException('Failed to update invitation');
    }
    return updatedInvitation;
  }

  async reject(id: string): Promise<Invitation> {
    const invitation = await this.findOne(id);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Can only reject pending invitations');
    }

    const updatedInvitation = await this.invitationRepository.update(id, InvitationStatus.REJECTED);
    if (!updatedInvitation) {
      throw new NotFoundException('Failed to update invitation');
    }
    return updatedInvitation;
  }
}
