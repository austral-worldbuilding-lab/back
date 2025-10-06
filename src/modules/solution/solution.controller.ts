import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { CreateSolutionDecorator } from './decorators/create-solution.decorator';
import { DeleteSolutionDecorator } from './decorators/delete-solution.decorator';
import { GetSolutionByIdDecorator } from './decorators/get-solution-by-id.decorator';
import { GetSolutionsByProjectDecorator } from './decorators/get-solutions-by-project.decorator';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { SolutionDto } from './dto/solution.dto';
import { SolutionService } from './solution.service';

@ApiTags('solutions')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller()
export class SolutionController {
  constructor(private readonly solutionService: SolutionService) {}

  @Post('project/:projectId/solution')
  @CreateSolutionDecorator()
  async create(
    @Param('projectId') projectId: string,
    @Body() createSolutionDto: CreateSolutionDto,
  ): Promise<SolutionDto> {
    return this.solutionService.create(projectId, createSolutionDto);
  }

  @Get('project/:projectId/solutions')
  @GetSolutionsByProjectDecorator()
  async findAll(@Param('projectId') projectId: string): Promise<SolutionDto[]> {
    return this.solutionService.findAll(projectId);
  }

  @Get('solutions/:id')
  @GetSolutionByIdDecorator()
  async findOne(@Param('id') id: string): Promise<SolutionDto> {
    return this.solutionService.findOne(id);
  }

  @Delete('solutions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteSolutionDecorator()
  async remove(@Param('id') id: string): Promise<void> {
    await this.solutionService.remove(id);
  }
}
