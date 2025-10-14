export interface AiGenerationEngineContext {
  projectId: string;
  selectedFiles?: string[];
  mandalaId?: string;
}

export interface AiGenerationStrategy<Input, Output> {
  /**
   * Build the final prompt to be sent to Gemini given the input.
   */
  buildPrompt(input: Input): Promise<string>;

  /**
   * Return the JSON schema (object) used to validate Gemini's response.
   * Some strategies may use min/max values from configuration.
   */
  getResponseSchema(input: Input): unknown;

  /**
   * Parse and validate the raw text returned by Gemini.
   */
  parseAndValidate(raw: string | undefined): Output;
}
