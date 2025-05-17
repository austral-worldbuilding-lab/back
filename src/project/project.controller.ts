import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { MinValuePipe } from '../pipes/min-value.pipe';
import { FirebaseAuthGuard } from '../auth/firebase/firebase.guard';

@Controller('project')
@UseGuards(FirebaseAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(
      createProjectDto,
      createProjectDto.userId,
    );
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe, new MinValuePipe(1))
    limit: number,
  ) {
    if (page && limit) {
      return this.projectService.findAllPaginated(page, limit);
    }
    return this.projectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('userId') userId: string) {
    return this.projectService.remove(id, userId);
  }
}
