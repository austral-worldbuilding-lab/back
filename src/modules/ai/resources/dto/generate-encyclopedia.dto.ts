export const createEncyclopediaResponseSchema = () => ({
  type: 'object',
  properties: {
    encyclopedia: {
      type: 'string',
      maxLength: 10000,
      description:
        'The comprehensive encyclopedia text of the project world in markdown format',
    },
    html: {
      type: 'string',
      maxLength: 50000,
      description:
        'A complete, navigable HTML document with tabs/sections, inline CSS, and JavaScript for offline use',
    },
  },
  required: ['encyclopedia', 'html'],
});
