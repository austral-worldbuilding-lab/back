import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChildProjectDto {
  @ApiProperty({
    description: 'Nombre del proyecto hijo',
    example: 'Subproyecto: Movilidad en el campus',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Descripción opcional del proyecto hijo',
    example:
      'Este subproyecto explora las soluciones de movilidad dentro del campus universitario.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Icono del proyecto hijo',
    example: 'folder',
    default: 'folder',
  })
  @IsString()
  @IsNotEmpty()
  icon!: string;
}

