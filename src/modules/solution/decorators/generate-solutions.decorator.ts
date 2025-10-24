import { ProjectRoleGuard } from '@modules/project/guards/project-role.guard';
import { RequireProjectRoles } from '@modules/project/guards/project-role.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { SolutionsJobResponseDto } from '../dto/solutions-job-response.dto';

export function GenerateSolutionsDecorator() {
  return applyDecorators(
    Throttle({ default: { limit: 10, ttl: 3600000 } }),
    UseGuards(ProjectRoleGuard),
    RequireProjectRoles('worldbuilder', 'dueño', 'facilitador'),
    ApiOperation({
      summary: 'Generate AI solutions for a project',
      description:
        'Queues a job to generate AI-powered solutions based on the project encyclopedia. The encyclopedia will always be generated fresh to ensure up-to-date content.',
    }),
    ApiParam({
      name: 'projectId',
      description: 'The ID of the project',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Solutions generation job has been queued',
      type: SolutionsJobResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error or job already in progress',
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
