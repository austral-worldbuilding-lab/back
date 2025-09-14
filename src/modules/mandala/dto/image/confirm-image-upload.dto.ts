import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class ConfirmImageUploadDto {
  @ApiProperty({
    description: 'ID único de la imagen (generado en el paso de presigned URL)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
