import { MaxValuePipe } from '@common/pipes/max-value.pipe';
import { MinValuePipe } from '@common/pipes/min-value.pipe';
import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';
import {
  MessageResponse,
  DataResponse,
  PaginatedResponse,
} from '@common/types/responses';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { RequestWithUser } from '@modules/auth/types/auth.types';
import { ProjectDto } from '@modules/project/dto/project.dto';
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
  Patch,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import {
  ApiCreateOrganization,
  ApiGetAllOrganizations,
  ApiGetOrganization,
  ApiUpdateOrganization,
  ApiDeleteOrganization,
  ApiGetOrganizationProjects,
} from './decorators/organization-swagger.decorators';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationDto } from './dto/organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import {
  OrganizationRoleGuard,
  RequireOrganizationRoles,
} from './guards/organization-role.guard';
import { OrganizationService } from './organization.service';

@ApiTags('Organizations')
@Controller('organization')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @ApiCreateOrganization()
  async create(
    @Body() dto: CreateOrganizationDto,
    @Req() req: RequestWithUser,
  ): Promise<MessageResponse<OrganizationDto>> {
    const org = await this.organizationService.create(dto, req.user.id);
    return {
      message: 'Organization created successfully',
      data: org,
    };
  }

  @Get()
  @ApiGetAllOrganizations()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query(
      'limit',
      new DefaultValuePipe(10),
      ParseIntPipe,
      new MinValuePipe(1),
      new MaxValuePipe(100),
    )
    limit: number,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<OrganizationDto>> {
    return await this.organizationService.findAllPaginated(
      page,
      limit,
      req.user.id,
    );
  }

  @Get(':id')
  @UseGuards(OrganizationRoleGuard)
  @ApiGetOrganization()
  async findOne(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<DataResponse<OrganizationDto>> {
    const org = await this.organizationService.findOne(id);
    return {
      data: org,
    };
  }

  @Patch(':id')
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles('owner')
  @ApiUpdateOrganization()
  async update(
    @Param('id', new UuidValidationPipe()) id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<MessageResponse<OrganizationDto>> {
    const org = await this.organizationService.update(id, dto);
    return {
      message: 'Organization updated successfully',
      data: org,
    };
  }

  @Delete(':id')
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles('owner')
  @ApiDeleteOrganization()
  async remove(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<MessageResponse<OrganizationDto>> {
    const org = await this.organizationService.remove(id);
    return {
      message: 'Organization deleted successfully',
      data: org,
    };
  }

  @Get(':id/projects')
  @UseGuards(OrganizationRoleGuard)
  @ApiGetOrganizationProjects()
  async findProjects(
    @Param('id', new UuidValidationPipe()) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query(
      'limit',
      new DefaultValuePipe(10),
      ParseIntPipe,
      new MinValuePipe(1),
      new MaxValuePipe(100),
    )
    limit: number,
  ): Promise<PaginatedResponse<ProjectDto>> {
    return this.organizationService.findOrganizationProjectsPaginated(
      id,
      page,
      limit,
    );
  }
}
