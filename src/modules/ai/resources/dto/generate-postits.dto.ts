export const createPostitsResponseSchema = (limits: {
  minItems: number;
  maxItems: number;
}) => ({
  type: 'array',
  items: {
    type: 'object',
    properties: {
      content: { type: 'string' },
      dimension: { type: 'string' },
      scale: { type: 'string' },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['content', 'dimension', 'scale'],
    propertyOrdering: ['content', 'dimension', 'scale', 'tags'],
  },
  minItems: limits.minItems,
  maxItems: limits.maxItems,
});

export const createPostitsSummaryResponseSchema = (limits: {
  minItems: number;
  maxItems: number;
}) => ({
  type: 'array',
  items: {
    type: 'object',
    properties: {
      content: { type: 'string' },
      dimension: { type: 'string' },
      scale: { type: 'string' },
      type: { type: 'string' },
      fromSummary: { type: 'array', items: { type: 'string' } },
    },
    required: ['content', 'dimension', 'scale', 'type', 'fromSummary'],
    propertyOrdering: ['content', 'dimension', 'scale', 'type', 'fromSummary'],
  },
  minItems: limits.minItems,
  maxItems: limits.maxItems,
});

export const createSolutionsResponseSchema = (limits: {
  minItems: number;
  maxItems: number;
}) => ({
  type: 'array',
  items: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      provocation: { type: 'string' },
    },
    required: ['title', 'description', 'provocation'],
    propertyOrdering: ['title', 'description', 'provocation'],
  },
  minItems: limits.minItems,
  maxItems: limits.maxItems,
});
