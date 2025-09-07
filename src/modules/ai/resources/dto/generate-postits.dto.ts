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
      section: { type: 'string' },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['content', 'dimension', 'section'],
    propertyOrdering: ['content', 'dimension', 'section', 'tags'],
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
      section: { type: 'string' },
      type: { type: 'string' },
      fromSummary: { type: 'array', items: { type: 'string' } },
    },
    required: ['content', 'dimension', 'section', 'type', 'fromSummary'],
    propertyOrdering: [
      'content',
      'dimension',
      'section',
      'type',
      'fromSummary',
    ],
  },
  minItems: limits.minItems,
  maxItems: limits.maxItems,
});
