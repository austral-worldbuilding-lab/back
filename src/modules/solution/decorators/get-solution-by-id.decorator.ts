import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { SolutionDto } from '../dto/solution.dto';

export function GetSolutionByIdDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get solution by ID',
      description: 'Returns a specific solution by its ID',
    }),
    ApiParam({
      name: 'solutionId',
      description: 'ID of the solution',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Solution retrieved successfully',
      type: SolutionDto,
    }),
    ApiResponse({
      status: 404,
      description: 'Solution not found',
    }),
  );
}
