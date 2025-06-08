import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CenterDto {
  @ApiProperty({
    description: 'Nombre del centro',
    example: 'Estudiante',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Descripción del centro',
    example: 'Alumno de 23 años que estudia en la universidad',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Color del centro en formato hexadecimal',
    example: '#3B82F6',
  })
  @IsString()
  @IsNotEmpty()
  color!: string;
}
