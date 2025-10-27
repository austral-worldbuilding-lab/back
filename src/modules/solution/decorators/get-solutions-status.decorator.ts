import { ProjectRoleGuard } from '@modules/project/guards/project-role.guard';
import { RequireProjectRoles } from '@modules/project/guards/project-role.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { SolutionsJobStatusDto } from '../dto/solutions-job-status.dto';

export function GetSolutionsStatusDecorator() {
  return applyDecorators(
    UseGuards(ProjectRoleGuard),
    RequireProjectRoles('worldbuilder', 'dueño', 'facilitador'),
    ApiOperation({
      summary: 'Get AI solutions generation job status',
      description:
        'Retrieves the status of the most recent AI solutions generation job for this project',
    }),
    ApiParam({
      name: 'projectId',
      description: 'The ID of the project',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Solutions job status retrieved successfully',
      type: SolutionsJobStatusDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - insufficient permissions',
    }),
    ApiResponse({
      status: 404,
      description: 'Project not found',
    }),
  );
}
