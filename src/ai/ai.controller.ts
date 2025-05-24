import { Controller, Post, Param } from '@nestjs/common';
import { AiService } from './ai.service.js';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-postits/:projectId')
  async generatePostits(@Param('projectId') projectId: string) {
    return this.aiService.generatePostits(projectId);
  }
}
