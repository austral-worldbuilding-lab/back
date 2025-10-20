import { ProjectRoleGuard } from '@modules/project/guards/project-role.guard';
import { RequireProjectRoles } from '@modules/project/guards/project-role.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function GetCachedSolutionsDecorator() {
  return applyDecorators(
    UseGuards(ProjectRoleGuard),
    RequireProjectRoles('member', 'owner', 'admin'),
    ApiOperation({
      summary: 'Get cached AI solutions for a project',
      description:
        'Retrieves previously generated AI solutions from cache for the specified project and user.',
    }),
    ApiParam({
      name: 'projectId',
      description: 'The ID of the project',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Cached solutions retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            problem: { type: 'string' },
            impactLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            impactDescription: { type: 'string' },
          },
        },
      },
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
