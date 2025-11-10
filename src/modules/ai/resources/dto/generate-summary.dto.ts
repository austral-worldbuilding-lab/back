export const createMandalaSummaryResponseSchema = () => ({
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'The comprehensive mandala summary text in markdown format',
    },
    html: {
      type: 'string',
      maxLength: 50000,
      description:
        'A complete, navigable HTML document with sections by dimensions/scales',
    },
  },
  required: ['summary', 'html'],
});
