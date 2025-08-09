export const QuestionsResponse = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      question: { type: 'string' },
      dimension: { type: 'string' },
      scale: { type: 'string' },
    },
  },
};
