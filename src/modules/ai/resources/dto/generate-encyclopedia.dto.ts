export const createEncyclopediaResponseSchema = () => ({
  type: 'string',
  maxLength: 10000, //TODO extract this to a environment variable
  description: 'The comprehensive encyclopedia text of the project world',
});
