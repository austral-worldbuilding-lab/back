import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';
import { MandalaDto } from '@modules/mandala/dto/mandala.dto';
import { MandalaService } from '@modules/mandala/mandala.service';
import { AiPostitResponse } from '@modules/mandala/types/postits';
import { ProjectService } from '@modules/project/project.service';
import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AiService } from './ai.service';
import {
  GenerateEncyclopediaDto,
  AiEncyclopediaResponseDto,
} from './dto/generate-encyclopedia.dto';

interface AiRequestBody {
  dimensions: string[];
  scales: string[];
  centerCharacter: string;
  centerCharacterDescription: string;
  tags: string[];
  selectedFiles?: string[];
  mandalaId?: string;
}

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly projectService: ProjectService,
    private readonly mandalaService: MandalaService,
  ) {}

  @Throttle({ default: { limit: 100, ttl: 3600000 } })
  @Post('generate-postits/:projectId')
  @ApiOperation({
    summary: 'Generate postits using AI',
    description: 'Generate postits for a project using AI',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated postits',
    type: [Object],
  })
  @ApiParam({
    name: 'projectId',
    description: 'Project ID to generate postits for',
  })
  async generatePostits(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Body() aiRequestBody: AiRequestBody,
  ): Promise<AiPostitResponse[]> {
    return this.aiService.generatePostits(
      projectId,
      aiRequestBody.dimensions,
      aiRequestBody.scales,
      aiRequestBody.centerCharacter,
      aiRequestBody.centerCharacterDescription,
      aiRequestBody.tags,
      aiRequestBody.selectedFiles,
      aiRequestBody.mandalaId,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @Post('generate-encyclopedia/:projectId')
  @ApiOperation({
    summary: 'Generate project encyclopedia using AI',
    description:
      'Generate a comprehensive encyclopedia of the project world using AI based on all mandala summaries',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated encyclopedia',
    type: AiEncyclopediaResponseDto,
  })
  @ApiParam({
    name: 'projectId',
    description: 'Project ID to generate encyclopedia for',
  })
  async generateEncyclopedia(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Body() generateEncyclopediaDto: GenerateEncyclopediaDto,
  ): Promise<AiEncyclopediaResponseDto> {
    const project = await this.projectService.findOne(projectId);
    const mandalas: MandalaDto[] = await this.mandalaService.findAll(projectId);
    const mandalaDocs = await Promise.all(
      mandalas.map((mandala: MandalaDto) =>
        this.mandalaService.getFirestoreDocument(projectId, mandala.id),
      ),
    );
    const allDimensions: string[] = [
      ...new Set(
        mandalas.flatMap((m: MandalaDto) =>
          m.configuration.dimensions.map((d: { name: string }) => d.name),
        ),
      ),
    ];
    const allScales: string[] = [
      ...new Set(mandalas.flatMap((m: MandalaDto) => m.configuration.scales)),
    ];

    // Obtener los resúmenes
    const mandalasSummariesWithAi =
      this.mandalaService.getAllMandalaSummariesWithAi(projectId, mandalaDocs);

    return this.aiService.generateEncyclopedia(
      projectId,
      project.name,
      project.description || '',
      allDimensions,
      allScales,
      mandalasSummariesWithAi,
      generateEncyclopediaDto.selectedFiles,
    );
  }
}
