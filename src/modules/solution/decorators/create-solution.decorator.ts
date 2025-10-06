import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { SolutionDto } from '../dto/solution.dto';

export function CreateSolutionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a solution for a root project',
      description:
        'Creates a new solution. Only allowed for root projects (projects without a parent).',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID of the root project',
      type: 'string',
    }),
    ApiResponse({
      status: 201,
      description: 'Solution created successfully',
      type: SolutionDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid payload or project is not a root project',
    }),
    ApiResponse({
      status: 404,
      description: 'Project not found',
    }),
  );
}
