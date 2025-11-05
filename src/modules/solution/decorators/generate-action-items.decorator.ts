import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

export function GenerateActionItemsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Generate action items for a solution using AI',
      description:
        'Generates a list of concrete, actionable steps to implement a solution. ' +
        'Requires the solution to exist and be active. ' +
        'Returns generated action items without persisting them to the database.',
    }),
    ApiParam({
      name: 'solutionId',
      description: 'ID of the solution to generate action items for',
      type: 'string',
      format: 'uuid',
    }),
    ApiResponse({
      status: 200,
      description: 'Action items successfully generated',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            order: {
              type: 'number',
              example: 1,
            },
            title: {
              type: 'string',
              example: 'Define project scope',
            },
            description: {
              type: 'string',
              example: 'Create a detailed project scope document',
            },
            duration: {
              type: 'string',
              example: '2 weeks',
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid solution ID format',
    }),
    ApiNotFoundResponse({
      description: 'Solution not found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
    ApiForbiddenResponse({
      description:
        'User does not have required role (worldbuilder, owner, or facilitator) in the project',
    }),
  );
}
