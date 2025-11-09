import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum OrganizationImageType {
  PROFILE_PICTURE = 'profilePicture',
  BANNER_PICTURE = 'bannerPicture',
}

export class ConfirmOrganizationImageDto {
  @ApiProperty({
    description: 'ID de la imagen subida (sin extensión)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsNotEmpty()
  imageId!: string;

  @ApiProperty({
    description: 'Tipo de imagen a confirmar',
    enum: OrganizationImageType,
    example: OrganizationImageType.PROFILE_PICTURE,
  })
  @IsEnum(OrganizationImageType)
  @IsNotEmpty()
  imageType!: OrganizationImageType;
}
