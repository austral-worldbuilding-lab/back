import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';
import { AiPostitResponse } from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions';
import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { AiService } from './ai.service';
import { QuestionsResponse } from './resources/dto/generate-questions.dto';

interface AiRequestBody {
  dimensions: string[];
  scales: string[];
  centerCharacter: string;
  centerCharacterDescription: string;
  tags: string[];
}

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
    );
  }

  @Post('generate-questions/:mandalaId')
  @ApiOperation({
    summary: 'Generate questions using AI',
    description:
      'Generate guiding questions for a project using AI based on mandala configuration and project files',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated questions',
    schema: QuestionsResponse,
  })
  @ApiParam({
    name: 'mandalaId',
    description: 'Mandala ID to generate questions for',
  })
  async generateQuestions(
    @Param('mandalaId', new UuidValidationPipe()) mandalaId: string,
    @Body() aiRequestBody: AiRequestBody,
  ): Promise<AiQuestionResponse[]> {
    return this.aiService.generateQuestions(
      mandalaId,
      aiRequestBody.dimensions,
      aiRequestBody.scales,
      aiRequestBody.tags,
      aiRequestBody.centerCharacter,
      aiRequestBody.centerCharacterDescription,
    );
  }
}
