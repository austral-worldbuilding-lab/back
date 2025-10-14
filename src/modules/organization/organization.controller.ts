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
  Put,
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
  ApiGetOrganizationUsers,
  ApiUpdateOrganizationUserRole,
  ApiRemoveUserFromOrganization,
} from './decorators/organization-swagger.decorators';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationUserRoleResponseDto } from './dto/organization-user-role-response.dto';
import { OrganizationUserDto } from './dto/organization-user.dto';
import { OrganizationDto } from './dto/organization.dto';
import { UpdateOrganizationUserRoleDto } from './dto/update-organization-user-role.dto';
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
    @Req() req: RequestWithUser,
  ): Promise<PaginatedResponse<ProjectDto>> {
    return this.organizationService.findOrganizationProjectsPaginated(
      id,
      page,
      limit,
      req.user.id,
    );
  }

  @Get(':organizationId/users')
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles('owner', 'admin', 'member')
  @ApiGetOrganizationUsers()
  async getOrganizationUsers(
    @Param('organizationId', new UuidValidationPipe()) organizationId: string,
  ): Promise<DataResponse<OrganizationUserDto[]>> {
    const users =
      await this.organizationService.getOrganizationUsers(organizationId);
    return {
      data: users,
    };
  }

  @Put(':organizationId/users/:userId/role')
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles('owner', 'admin')
  @ApiUpdateOrganizationUserRole()
  async updateUserRole(
    @Param('organizationId', new UuidValidationPipe()) organizationId: string,
    @Param('userId') userId: string,
    @Body() updateUserRoleDto: UpdateOrganizationUserRoleDto,
  ): Promise<MessageResponse<OrganizationUserRoleResponseDto>> {
    const userRole = await this.organizationService.updateUserRole(
      organizationId,
      userId,
      updateUserRoleDto.role,
    );
    return {
      message: 'Rol de usuario actualizado exitosamente',
      data: userRole,
    };
  }

  @Delete(':organizationId/users/:userId')
  @UseGuards(OrganizationRoleGuard)
  @RequireOrganizationRoles('owner', 'admin')
  @ApiRemoveUserFromOrganization()
  async removeUserFromOrganization(
    @Param('organizationId', new UuidValidationPipe()) organizationId: string,
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ): Promise<MessageResponse<OrganizationUserDto>> {
    const removedUser =
      await this.organizationService.removeUserFromOrganization(
        organizationId,
        userId,
        req.user.id,
      );
    return {
      message: 'Usuario eliminado de la organización exitosamente',
      data: removedUser,
    };
  }
}
