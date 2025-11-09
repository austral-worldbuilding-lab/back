import { ApiProperty } from '@nestjs/swagger';

import { OrganizationDto } from './organization.dto';

class PresignedImageDto {
  @ApiProperty({
    description: 'ID de la imagen a subir (sin extensión)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  imageId!: string;

  @ApiProperty({
    description: 'URL presignada temporal para subir imagen',
    example:
      'https://account.blob.core.windows.net/container/org/123/images/a1b2c3d4-e5f6-7890-abcd-ef1234567890?sig=...',
  })
  presignedUrl!: string;
}

export class OrganizationWithPresignedUrlDto extends OrganizationDto {
  @ApiProperty({
    description: 'Información para subir la foto de perfil',
    type: PresignedImageDto,
  })
  profilePicture!: PresignedImageDto;

  @ApiProperty({
    description: 'Información para subir la foto de banner',
    type: PresignedImageDto,
  })
  bannerPicture!: PresignedImageDto;
}
