import { ApiProperty } from '@nestjs/swagger';
import { AiService, AiModel } from '@prisma/client';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class ConsumptionFilterDto {
  @ApiProperty({
    description: 'Filtrar por ID de usuario',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Filtrar por ID de proyecto',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @IsString()
  projectId?: string;

  @ApiProperty({
    description: 'Filtrar por ID de organización',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @IsString()
  organizationId?: string;

  @ApiProperty({
    description: 'Filtrar por servicio de IA',
    required: false,
  })
  @IsOptional()
  @IsEnum(AiService)
  service?: AiService;

  @ApiProperty({
    description: 'Filtrar por modelo de IA',
    required: false,
  })
  @IsOptional()
  @IsEnum(AiModel)
  model?: AiModel;

  @ApiProperty({
    description: 'Fecha de inicio para filtrar consumos',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin para filtrar consumos',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
