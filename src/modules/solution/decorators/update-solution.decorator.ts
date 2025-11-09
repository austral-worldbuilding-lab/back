import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { SolutionDto } from '../dto/solution.dto';

export function UpdateSolutionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a solution',
      description:
        'Updates an existing solution. All fields are optional. You can update title, description, problem, impact, provocations, and action items.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID of the solution to update',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Solution updated successfully',
      type: SolutionDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid payload or invalid provocation IDs',
    }),
    ApiResponse({
      status: 404,
      description: 'Solution not found',
    }),
  );
}
