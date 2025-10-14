export const createQuestionsResponseSchema = (limits: {
  minItems: number;
  maxItems: number;
}) => ({
  type: 'array',
  items: {
    type: 'object',
    properties: {
      question: { type: 'string' },
      dimension: { type: 'string' },
      scale: { type: 'string' },
    },
    required: ['question', 'dimension', 'scale'],
    propertyOrdering: ['question', 'dimension', 'scale'],
  },
  minItems: limits.minItems,
  maxItems: limits.maxItems,
});
