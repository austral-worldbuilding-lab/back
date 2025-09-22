import { ApiProperty } from '@nestjs/swagger';
import { AiService, AiModel } from '@prisma/client';
import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class ConsumptionDto {
  @ApiProperty({
    description: 'ID único del registro de consumo',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Fecha y hora del consumo',
  })
  @IsDateString()
  timestamp!: Date;

  @IsEnum(AiService)
  service!: AiService;

  @IsEnum(AiModel)
  model!: AiModel;

  @ApiProperty({
    description: 'ID del usuario que realizó el consumo',
  })
  @IsUUID()
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'ID del proyecto asociado al consumo',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @IsString()
  projectId?: string;

  @ApiProperty({
    description: 'ID de la organización asociada al consumo',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @IsString()
  organizationId?: string;

  @ApiProperty({
    description: 'Cantidad de tokens consumidos',
  })
  @IsNumber()
  quantity!: number;
}
