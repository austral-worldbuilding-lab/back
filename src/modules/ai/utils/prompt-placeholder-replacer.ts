export interface PromptReplacementConfig {
  dimensions?: string[];
  scales?: string[];
  centerCharacter?: string;
  centerCharacterDescription?: string;
  tags?: string[];
  mandalaDocument?: string;
  mandalaSummaryWithAi?: string;
  maxResults?: number;
  minResults?: number;
  projectName?: string;
  projectDescription?: string;
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
    return prompt.replace(/\$\{centerCharacterDescription}/g, 'N/A');
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
    return prompt.replace(/\$\{tags}/g, 'N/A');
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

const replaceProjectName: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{projectName\}/g.test(prompt)) {
    throw new Error('Missing placeholder ${projectName} in prompt');
  }
  if (config.projectName === undefined) {
    throw new Error(
      'projectName config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{projectName}/g, config.projectName);
};

const replaceProjectDescription: PlaceholderReplacer = (prompt, config) => {
  if (config.projectDescription === undefined) {
    throw new Error(
      'projectDescription config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{projectDescription}/g, config.projectDescription);
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

const summaryReplacer = composeReplacers(
  replaceDimensions,
  replaceScales,
  replaceCenterCharacter,
  replaceCenterCharacterDescription,
  replaceMandalaDocument,
);

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
  replaceTags,
  replaceCenterCharacter,
  replaceCenterCharacterDescription,
  replaceMandalaDocument,
  replaceMaxResults,
  replaceMinResults,
);

const comparisonReplacer = composeReplacers(
  replaceMandalaDocument,
  replaceMaxResults,
  replaceMinResults,
);

const provocationReplacer = composeReplacers(
  replaceProjectName,
  replaceProjectDescription,
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

/**
 * Replace placeholders for provocation generation prompts
 * @param promptTemplate - The template string containing placeholders
 * @param config - Configuration object with values to replace placeholders
 * @returns The prompt with all placeholders replaced
 */
export function replaceProvocationPlaceholders(
  promptTemplate: string,
  config: PromptReplacementConfig = {},
): string {
  return replaceWithReplacer(
    promptTemplate,
    config,
    provocationReplacer,
    'provocation',
  );
}

/**
 * Replace placeholders for mandala summary generation prompts
 * @param promptTemplate - The template string containing placeholders
 * @param config - Configuration object with values to replace placeholders
 * @returns The prompt with all placeholders replaced
 */
export function replaceMandalaSummaryPlaceholders(
  promptTemplate: string, // The template string containing placeholders
  config: PromptReplacementConfig = {}, // Configuration object with values to replace placeholders
): string {
  return replaceWithReplacer(
    promptTemplate,
    config,
    summaryReplacer,
    'mandala summary',
  );
}
