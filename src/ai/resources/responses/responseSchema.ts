export const PostitsResponse = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      content: { type: 'string' },
      dimension: { type: 'string' },
      section: { type: 'string' },
    },
  },
};
