/**
 * AI Temperature Configuration
 *
 * Controls the creativity/randomness of AI responses for different generation types.
 * Temperature range: 0.0 (deterministic) to 1.0 (maximum creativity)
 *
 * Recommended values by generation type:
 * - Postits (0.7): Moderate-high creativity for ideation
 * - Context Postits (0.7): Moderate-high creativity for contextual ideation
 * - Questions (0.6): Balanced creativity and consistency
 * - Provocations (0.9): Maximum creativity for disruptive ideas
 * - Encyclopedia (0.3): High consistency and precision
 * - Mandala Summary (0.4): Consistency with some synthesis capability
 * - Postits Summary (0.4): Consistency for comparative analysis
 * - Solutions (0.7): Moderate-high creativity for innovative solutions
 */

export interface AiTemperatureConfig {
  postits: number;
  contextPostits: number;
  questions: number;
  provocations: number;
  encyclopedia: number;
  mandalaSummary: number;
  postitsSummary: number;
  solutions: number;
}

/**
 * Default temperature values for each generation type
 */
const DEFAULT_TEMPERATURES = {
  postits: 0.7,
  contextPostits: 0.7,
  questions: 0.6,
  provocations: 0.9,
  encyclopedia: 0.3,
  mandalaSummary: 0.4,
  postitsSummary: 0.4,
  solutions: 0.7,
} as const;

/**
 * Validates that a temperature value is within the valid range (0.0 to 1.0)
 */
function validateTemperature(value: number, name: string): number {
  if (isNaN(value)) {
    throw new Error(
      `Invalid temperature value for ${name}: must be a number between 0.0 and 1.0`,
    );
  }
  if (value < 0.0 || value > 1.0) {
    throw new Error(
      `Invalid temperature value for ${name}: ${value}. Must be between 0.0 and 1.0`,
    );
  }
  return value;
}

/**
 * Parses and validates a temperature value from environment variable
 */
function parseTemperature(
  envValue: string | undefined,
  defaultValue: number,
  name: string,
): number {
  if (!envValue) {
    return defaultValue;
  }

  const parsed = parseFloat(envValue);
  return validateTemperature(parsed, name);
}

/**
 * Returns AI temperature configuration with environment variable overrides
 */
export const getAiTemperatureConfig = (): AiTemperatureConfig => {
  const config = {
    postits: parseTemperature(
      process.env.AI_TEMPERATURE_POSTITS,
      DEFAULT_TEMPERATURES.postits,
      'AI_TEMPERATURE_POSTITS',
    ),
    contextPostits: parseTemperature(
      process.env.AI_TEMPERATURE_CONTEXT_POSTITS,
      DEFAULT_TEMPERATURES.contextPostits,
      'AI_TEMPERATURE_CONTEXT_POSTITS',
    ),
    questions: parseTemperature(
      process.env.AI_TEMPERATURE_QUESTIONS,
      DEFAULT_TEMPERATURES.questions,
      'AI_TEMPERATURE_QUESTIONS',
    ),
    provocations: parseTemperature(
      process.env.AI_TEMPERATURE_PROVOCATIONS,
      DEFAULT_TEMPERATURES.provocations,
      'AI_TEMPERATURE_PROVOCATIONS',
    ),
    encyclopedia: parseTemperature(
      process.env.AI_TEMPERATURE_ENCYCLOPEDIA,
      DEFAULT_TEMPERATURES.encyclopedia,
      'AI_TEMPERATURE_ENCYCLOPEDIA',
    ),
    mandalaSummary: parseTemperature(
      process.env.AI_TEMPERATURE_MANDALA_SUMMARY,
      DEFAULT_TEMPERATURES.mandalaSummary,
      'AI_TEMPERATURE_MANDALA_SUMMARY',
    ),
    postitsSummary: parseTemperature(
      process.env.AI_TEMPERATURE_POSTITS_SUMMARY,
      DEFAULT_TEMPERATURES.postitsSummary,
      'AI_TEMPERATURE_POSTITS_SUMMARY',
    ),
    solutions: parseTemperature(
      process.env.AI_TEMPERATURE_SOLUTIONS,
      DEFAULT_TEMPERATURES.solutions,
      'AI_TEMPERATURE_SOLUTIONS',
    ),
  };

  return config;
};

/**
 * Export default temperatures for documentation purposes
 */
export const AI_TEMPERATURE_DEFAULTS = DEFAULT_TEMPERATURES;
