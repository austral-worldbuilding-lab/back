import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function DeleteSolutionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete solution',
      description: 'Deletes a solution by setting deletedAt and isActive=false',
    }),
    ApiParam({
      name: 'solutionId',
      description: 'ID of the solution',
      type: 'string',
    }),
    ApiResponse({
      status: 204,
      description: 'Solution deleted successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Solution not found',
    }),
  );
}
