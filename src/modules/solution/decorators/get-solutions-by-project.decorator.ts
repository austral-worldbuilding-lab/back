import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { SolutionDto } from '../dto/solution.dto';

export function GetSolutionsByProjectDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all solutions for a project',
      description: 'Returns all active solutions associated with a project',
    }),
    ApiParam({
      name: 'projectId',
      description: 'ID of the project',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Solutions retrieved successfully',
      type: [SolutionDto],
    }),
    ApiResponse({
      status: 404,
      description: 'Project not found',
    }),
  );
}
