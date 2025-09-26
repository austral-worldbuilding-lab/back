import { ApiProperty } from '@nestjs/swagger';
import { AiService, AiModel } from '@prisma/client';
import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class CreateConsumptionDto {
  @ApiProperty({
    description: 'Servicio de IA utilizado',
    enum: AiService,
    example: AiService.GENERATE_POSTITS,
  })
  @IsEnum(AiService)
  service!: AiService;

  @ApiProperty({
    description: 'Modelo de IA utilizado',
    enum: AiModel,
    example: AiModel.GEMINI_25_FLASH,
  })
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
  @IsPositive()
  quantity!: number;
}
