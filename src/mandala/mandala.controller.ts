import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MandalaService } from './mandala.service';
import { CreateMandalaDto } from './dto/create-mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { ProjectRoleGuard, AllowedRoles } from './guards/project-role.guard';
import { ProjectParticipantGuard } from './guards/project-participant.guard';

@Controller('mandala')
export class MandalaController {
  constructor(private readonly mandalaService: MandalaService) {}

  @Post()
  @UseGuards(ProjectRoleGuard)
  @AllowedRoles('owner', 'member')
  create(@Body() createMandalaDto: CreateMandalaDto) {
    return this.mandalaService.create(createMandalaDto);
  }

  @Get()
  @UseGuards(ProjectParticipantGuard)
  findAll(@Query('projectId') projectId: string) {
    return this.mandalaService.findAll(projectId);
  }

  @Get(':id')
  @UseGuards(ProjectParticipantGuard)
  findOne(@Param('id') id: string) {
    return this.mandalaService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ProjectRoleGuard)
  @AllowedRoles('owner', 'member')
  update(@Param('id') id: string, @Body() updateMandalaDto: UpdateMandalaDto) {
    return this.mandalaService.update(id, updateMandalaDto);
  }

  @Delete(':id')
  @UseGuards(ProjectRoleGuard)
  @AllowedRoles('owner')
  remove(@Param('id') id: string) {
    return this.mandalaService.remove(id);
  }

  @Post('generate')
  @UseGuards(ProjectRoleGuard)
  @AllowedRoles('owner', 'member')
  generate() {
    return this.mandalaService.generate();
  }
}
