export const createActionItemsResponseSchema = (limits: {
  minItems: number;
  maxItems: number;
}) => ({
  type: 'array',
  items: {
    type: 'object',
    properties: {
      order: { type: 'number' },
      title: { type: 'string' },
      description: { type: 'string' },
      duration: { type: 'string' },
    },
    required: ['order', 'title', 'description'],
    propertyOrdering: ['order', 'title', 'description', 'duration'],
  },
  minItems: limits.minItems,
  maxItems: limits.maxItems,
});
