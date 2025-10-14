import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';
import { AiPostitResponse } from '@modules/mandala/types/postits';
import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AiService } from './ai.service';

interface AiRequestBody {
  projectName: string;
  projectDescription: string;
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
  constructor(private readonly aiService: AiService) {}

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
      aiRequestBody.projectName,
      aiRequestBody.projectDescription,
      aiRequestBody.dimensions,
      aiRequestBody.scales,
      aiRequestBody.centerCharacter,
      aiRequestBody.centerCharacterDescription,
      aiRequestBody.tags,
      aiRequestBody.selectedFiles,
      aiRequestBody.mandalaId,
    );
  }
}
