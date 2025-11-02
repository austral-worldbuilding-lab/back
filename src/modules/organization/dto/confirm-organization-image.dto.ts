import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmOrganizationImageDto {
  @ApiProperty({
    description: 'ID de la imagen subida (sin extensión)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsNotEmpty()
  imageId!: string;
}
