import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateImagePresignedUrlDto {
  @ApiProperty({
    description: 'Nombre del archivo de imagen',
    example: 'imagen-mandala.jpg',
  })
  @IsString()
  @IsNotEmpty()
  fileName!: string;
}
