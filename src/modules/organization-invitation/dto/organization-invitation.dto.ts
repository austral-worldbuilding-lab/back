import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';

export class OrganizationInvitationDto {
  @ApiProperty({ example: 'b7e7a9b4-8cdd-4f8e-9a7e-2a5d8b1c3f92' })
  id!: string;

  @ApiProperty({ example: 'usuario@example.com' })
  email!: string;

  @ApiProperty({ example: '0b5d7c1a-3f2e-45a6-9f3c-1e2d4f6a8b0c' })
  token!: string;

  @ApiProperty({ enum: InvitationStatus, example: InvitationStatus.PENDING })
  status!: InvitationStatus;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z' })
  expiresAt!: Date;

  @ApiProperty({ example: '44f1f4a0-2a21-4b6d-bc85-9b2d9b2d1f0e' })
  organizationId!: string;

  @ApiProperty({ example: 'c51b0a4b-0f2d-4b21-9a2e-6d3f9a8b7c6d' })
  invitedById!: string;

  @ApiProperty({
    example: 'c9c9a4a1-5c0d-4a1f-9f0a-7b3c2d1e4f5a',
    nullable: true,
    required: false,
  })
  roleId?: string | null;
}
