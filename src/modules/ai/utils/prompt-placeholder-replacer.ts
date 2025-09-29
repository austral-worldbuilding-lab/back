export interface PromptReplacementConfig {
  dimensions?: string[];
  scales?: string[];
  centerCharacter?: string;
  centerCharacterDescription?: string;
  tags?: string[];
  mandalaDocument?: string;
  mandalasSummariesWithAi?: string;
  maxResults?: number;
  minResults?: number;
  maxPostits?: number;
  minPostits?: number;
  maxQuestions?: number;
  minQuestions?: number;
  projectName?: string;
  projectDescription?: string;
}

type PlaceholderReplacer = (
  prompt: string,
  config: PromptReplacementConfig,
) => string;

const replaceDimensions: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{dimensions}/.test(prompt)) {
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
  if (!/\$\{scales}/.test(prompt)) {
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
  if (!/\$\{centerCharacter}/.test(prompt)) {
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
  if (!/\$\{centerCharacterDescription}/.test(prompt)) {
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
  if (!/\$\{tags}/.test(prompt)) {
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
  if (!/\$\{mandalaDocument}/.test(prompt)) {
    throw new Error('Missing placeholder ${mandalaDocument} in prompt');
  }
  if (config.mandalaDocument === undefined) {
    throw new Error(
      'mandalaDocument config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{mandalaDocument}/g, config.mandalaDocument);
};

const replaceMandalasSummariesWithAi: PlaceholderReplacer = (
  prompt,
  config,
) => {
  if (!/\$\{mandalasSummariesWithAi}/.test(prompt)) {
    throw new Error('Missing placeholder ${mandalasSummariesWithAi} in prompt');
  }
  if (config.mandalasSummariesWithAi === undefined) {
    throw new Error(
      'mandalasSummariesWithAi config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(
    /\$\{mandalasSummariesWithAi}/g,
    config.mandalasSummariesWithAi,
  );
};

const replaceMaxResults: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{maxResults}/.test(prompt)) {
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
  if (!/\$\{minResults}/.test(prompt)) {
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
  if (!/\$\{projectName}/.test(prompt)) {
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

const replaceMaxPostits: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{maxPostits}/.test(prompt)) {
    throw new Error('Missing placeholder ${maxPostits} in prompt');
  }
  if (config.maxPostits === undefined) {
    throw new Error(
      'maxPostits config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{maxPostits}/g, config.maxPostits.toString());
};

const replaceMinPostits: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{minPostits}/.test(prompt)) {
    throw new Error('Missing placeholder ${minPostits} in prompt');
  }
  if (config.minPostits === undefined) {
    throw new Error(
      'minPostits config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{minPostits}/g, config.minPostits.toString());
};

const replaceMaxQuestions: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{maxQuestions}/.test(prompt)) {
    throw new Error('Missing placeholder ${maxQuestions} in prompt');
  }
  if (config.maxQuestions === undefined) {
    throw new Error(
      'maxQuestions config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{maxQuestions}/g, config.maxQuestions.toString());
};

const replaceMinQuestions: PlaceholderReplacer = (prompt, config) => {
  if (!/\$\{minQuestions}/.test(prompt)) {
    throw new Error('Missing placeholder ${minQuestions} in prompt');
  }
  if (config.minQuestions === undefined) {
    throw new Error(
      'minQuestions config placeholder is required in prompt to be replaced',
    );
  }
  return prompt.replace(/\$\{minQuestions}/g, config.minQuestions.toString());
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
  replaceProjectName,
  replaceProjectDescription,
  replaceDimensions,
  replaceScales,
  replaceCenterCharacter,
  replaceCenterCharacterDescription,
  replaceTags,
  replaceMaxPostits,
  replaceMinPostits,
);

const questionReplacer = composeReplacers(
  replaceProjectName,
  replaceProjectDescription,
  replaceDimensions,
  replaceScales,
  replaceTags,
  replaceCenterCharacter,
  replaceCenterCharacterDescription,
  replaceMandalaDocument,
  replaceMaxQuestions,
  replaceMinQuestions,
);

const comparisonReplacer = composeReplacers(
  replaceProjectName,
  replaceProjectDescription,
  replaceMandalaDocument,
  replaceMaxResults,
  replaceMinResults,
);

const provocationReplacer = composeReplacers(
  replaceProjectName,
  replaceProjectDescription,
  replaceMandalaDocument,
  replaceMandalasSummariesWithAi,
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
