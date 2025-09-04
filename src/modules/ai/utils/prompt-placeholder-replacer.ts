export interface PromptReplacementConfig {
  dimensions?: string[];
  scales?: string[];
  centerCharacter?: string;
  centerCharacterDescription?: string;
  tags?: string[];
  mandalaDocument?: string;
  maxResults?: number;
  minResults?: number;
}

type PlaceholderReplacer = (
  prompt: string,
  config: PromptReplacementConfig,
) => string;

const replaceDimensions: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{dimensions\}/g.test(prompt)) {
    throw new Error('Missing placeholder ${dimensions} in prompt');
  }
  if (config.dimensions === undefined) {
    throw new Error(
      'dimensions config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{dimensions}/g, config.dimensions.join(', '));
};

const replaceScales: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{scales\}/g.test(prompt)) {
    throw new Error('Missing placeholder ${scales} in prompt');
  }
  if (config.scales === undefined) {
    throw new Error(
      'scales config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{scales}/g, config.scales.join(', '));
};

const replaceCenterCharacter: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{centerCharacter\}/g.test(prompt)) {
    throw new Error('Missing placeholder ${centerCharacter} in prompt');
  }
  if (config.centerCharacter === undefined) {
    throw new Error(
      'centerCharacter config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{centerCharacter}/g, config.centerCharacter);
};

const replaceCenterCharacterDescription: PlaceholderReplacer = (
  prompt,
  config,
) => {
  if (!/\$\{centerCharacterDescription\}/g.test(prompt)) {
    throw new Error(
      'Missing placeholder ${centerCharacterDescription} in prompt',
    );
  }
  if (config.centerCharacterDescription === undefined) {
    throw new Error(
      'centerCharacterDescription config placeholder is required in prompt to be replaced',
    );
  }
  if (config.centerCharacterDescription === '') {
    return prompt.replace(/\$\{centerCharacterDescription}/g, '');
  }
  return prompt.replace(
    /\$\{centerCharacterDescription}/g,
    config.centerCharacterDescription,
  );
};

const replaceTags: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{tags\}/g.test(prompt)) {
    throw new Error('Missing placeholder ${tags} in prompt');
  }
  if (config.tags === undefined) {
    throw new Error(
      'tags config placeholder is required in prompt to be replaced',
    );
  }
  if (config.tags.length === 0) {
    return prompt.replace(/\$\{tags}/g, '');
  }
  return prompt.replace(/\$\{tags}/g, config.tags.join(', '));
};

const replaceMandalaDocument: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{mandalaDocument\}/g.test(prompt)) {
    throw new Error('Missing placeholder ${mandalaDocument} in prompt');
  }
  if (config.mandalaDocument === undefined) {
    throw new Error(
      'mandalaDocument config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{mandalaDocument}/g, config.mandalaDocument);
};

const replaceMaxResults: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{maxResults\}/g.test(prompt)) {
    throw new Error('Missing placeholder ${maxResults} in prompt');
  }
  if (config.maxResults === undefined) {
    throw new Error(
      'maxResults config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{maxResults}/g, config.maxResults.toString());
};

const replaceMinResults: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{minResults\}/g.test(prompt)) {
    throw new Error('Missing placeholder ${minResults} in prompt');
  }
  if (config.minResults === undefined) {
    throw new Error(
      'minResults config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{minResults}/g, config.minResults.toString());
};

const composeReplacers = (
  ...replacers: PlaceholderReplacer[]
): PlaceholderReplacer => {
  return (prompt: string, config: PromptReplacementConfig) => {
    return replacers.reduce(
      (currentPrompt, replacer) => replacer(currentPrompt, config),
      prompt,
    );
  };
};

const postitReplacer = composeReplacers(
  replaceDimensions,
  replaceScales,
  replaceCenterCharacter,
  replaceCenterCharacterDescription,
  replaceTags,
  replaceMaxResults,
  replaceMinResults,
);

const questionReplacer = composeReplacers(
  replaceDimensions,
  replaceScales,
  replaceCenterCharacter,
  replaceCenterCharacterDescription,
  replaceTags,
  replaceMandalaDocument,
  replaceMaxResults,
  replaceMinResults,
);

const comparisonReplacer = composeReplacers(
  replaceMandalaDocument,
  replaceMaxResults,
  replaceMinResults,
);

function replaceWithReplacer(
  promptTemplate: string,
  config: PromptReplacementConfig,
  replacer: PlaceholderReplacer,
  generationType: string,
): string {
  if (!promptTemplate?.trim()) {
    throw new Error('Prompt template is required');
  }

  const processedPrompt = replacer(promptTemplate, config);

  const remainingPlaceholders = processedPrompt.match(/\$\{[^}]+}/g);
  if (remainingPlaceholders?.length) {
    throw new Error(
      `Unreplaced placeholders found in ${generationType} prompt: ${remainingPlaceholders.join(', ')}`,
    );
  }

  return processedPrompt;
}

/**
 * Replace placeholders for postit generation prompts
 * @param promptTemplate - The template string containing placeholders
 * @param config - Configuration object with values to replace placeholders
 * @returns The prompt with all placeholders replaced
 */
export function replacePostitPlaceholders(
  promptTemplate: string,
  config: PromptReplacementConfig = {},
): string {
  return replaceWithReplacer(promptTemplate, config, postitReplacer, 'postit');
}

/**
 * Replace placeholders for question generation prompts
 * @param promptTemplate - The template string containing placeholders
 * @param config - Configuration object with values to replace placeholders
 * @returns The prompt with all placeholders replaced
 */
export function replaceQuestionPlaceholders(
  promptTemplate: string,
  config: PromptReplacementConfig = {},
): string {
  return replaceWithReplacer(
    promptTemplate,
    config,
    questionReplacer,
    'question',
  );
}

/**
 * Replace placeholders for comparison generation prompts
 * @param promptTemplate - The template string containing placeholders
 * @param config - Configuration object with values to replace placeholders
 * @returns The prompt with all placeholders replaced
 */
export function replaceComparisonPlaceholders(
  promptTemplate: string,
  config: PromptReplacementConfig = {},
): string {
  return replaceWithReplacer(
    promptTemplate,
    config,
    comparisonReplacer,
    'comparison',
  );
}
