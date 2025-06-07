import { Controller, Post, Param, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { Postit } from '@modules/mandala/types/postits';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

interface AiRequestBody {
  dimensions: string[];
  scales: string[];
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
    @Param('projectId') projectId: string,
    @Body() aiRequestBody: AiRequestBody,
  ): Promise<Postit[]> {
    return this.aiService.generatePostits(
      projectId,
      aiRequestBody.dimensions,
      aiRequestBody.scales,
    );
  }
}
