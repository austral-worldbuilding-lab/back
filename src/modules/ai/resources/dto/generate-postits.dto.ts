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
  type: 'object',
  properties: {
    comparisons: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          dimension: { type: 'string' },
          scale: { type: 'string' },
          type: { type: 'string' },
          fromSummary: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['content', 'dimension', 'scale', 'type', 'fromSummary'],
        propertyOrdering: [
          'content',
          'dimension',
          'scale',
          'type',
          'fromSummary',
        ],
      },
      minItems: limits.minItems,
      maxItems: limits.maxItems,
    },
    report: {
      type: 'object',
      properties: {
        summary: { type: 'string', maxLength: 1200 },
        coincidences: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 8,
        },
        tensions: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 8,
        },
        insights: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 8,
        },
      },
      required: ['summary', 'coincidences', 'tensions', 'insights'],
    },
  },
  required: ['comparisons', 'report'],
});

export const createProvocationsResponseSchema = (limits: {
  minItems: number;
  maxItems: number;
}) => ({
  type: 'array',
  items: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      question: { type: 'string' },
    },
    required: ['title', 'description', 'question'],
    propertyOrdering: ['title', 'description', 'question'],
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
      problem: { type: 'string' },
      impactLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
      impactDescription: { type: 'string' },
    },
    required: [
      'title',
      'description',
      'problem',
      'impactLevel',
      'impactDescription',
    ],
    propertyOrdering: [
      'title',
      'description',
      'problem',
      'impactLevel',
      'impactDescription',
    ],
  },
  minItems: limits.minItems,
  maxItems: limits.maxItems,
});
