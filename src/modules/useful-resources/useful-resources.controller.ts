import { DataResponse } from '@common/types/responses';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UsefulResourceDto } from './dto/useful-resource.dto';
import { UsefulResourcesService } from './useful-resources.service';

@ApiTags('Useful Resources')
@Controller('useful-resources')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class UsefulResourcesController {
  constructor(
    private readonly usefulResourcesService: UsefulResourcesService,
  ) {}

  @Get()
  async getAllResources(): Promise<DataResponse<UsefulResourceDto[]>> {
    const resources = await this.usefulResourcesService.getAllResources();
    return { data: resources };
  }
}
