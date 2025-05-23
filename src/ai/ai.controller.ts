import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { GeneratePostitsDto } from './dto/generate-postit.dto.js';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('generate-postits')
    async generatePostits(@Body() dto: GeneratePostitsDto) {
        return this.aiService.generatePostits(
            dto.files
        );
    }
}
