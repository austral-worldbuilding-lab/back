import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Invitation, InvitationStatus } from './entities/invitation.entity';

@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  create(@Body() createInvitationDto: CreateInvitationDto): Promise<Invitation> {
    return this.invitationService.create(createInvitationDto);
  }

  @Get()
  findAll(): Promise<Invitation[]> {
    return this.invitationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Invitation> {
    return this.invitationService.findOne(id);
  }

  @Post(':id/resend')
  resend(@Param('id') id: string): Promise<Invitation> {
    return this.invitationService.resend(id);
  }

  @Post(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: InvitationStatus
  ): Promise<Invitation> {
    if (status === InvitationStatus.ACCEPTED) {
      return this.invitationService.accept(id);
    }
    return this.invitationService.reject(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.invitationService.remove(id);
  }
}
