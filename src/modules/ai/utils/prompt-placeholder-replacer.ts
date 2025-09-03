export interface PromptReplacementConfig {
  dimensions?: string[];
  scales?: string[];
  centerCharacter?: string;
  centerCharacterDescription?: string;
  tags?: string[];
  mandalaDocument?: string;
}

type PlaceholderReplacer = (
  prompt: string,
  config: PromptReplacementConfig,
) => string;

const replaceDimensions: PlaceholderReplacer = (prompt, config) => {
  if (config.dimensions === undefined) return prompt;
  return prompt.replace(
    /\$\{dimensions}/g,
    config.dimensions?.join(', ') || '',
  );
};

const replaceScales: PlaceholderReplacer = (prompt, config) => {
  if (config.scales === undefined) return prompt;
  return prompt.replace(/\$\{scales}/g, config.scales?.join(', ') || '');
};

const replaceCenterCharacter: PlaceholderReplacer = (prompt, config) => {
  if (config.centerCharacter === undefined) return prompt;
  return prompt.replace(/\$\{centerCharacter}/g, config.centerCharacter || '');
};

const replaceCenterCharacterDescription: PlaceholderReplacer = (
  prompt,
  config,
) => {
  if (config.centerCharacterDescription === undefined) return prompt;
  return prompt.replace(
    /\$\{centerCharacterDescription}/g,
    config.centerCharacterDescription || '',
  );
};

const replaceTags: PlaceholderReplacer = (prompt, config) => {
  if (config.tags === undefined) return prompt;
  return prompt.replace(/\$\{tags}/g, config.tags?.join(', ') || '');
};

const replaceMandalaDocument: PlaceholderReplacer = (prompt, config) => {
  if (config.mandalaDocument === undefined) return prompt;
  return prompt.replace(/\$\{mandalaDocument}/g, config.mandalaDocument || '');
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

const standardReplacer = composeReplacers(
  replaceDimensions,
  replaceScales,
  replaceCenterCharacter,
  replaceCenterCharacterDescription,
  replaceTags,
  replaceMandalaDocument,
);

/**
 * Reemplaza los placeholders dinámicos en el prompt de mandala inicial
 * @param promptTemplate - The template string containing placeholders
 * @param config - Configuration object with values to replace placeholders
 * @returns El prompt con todos los placeholders reemplazados
 */
export function replacePromptPlaceholders(
  promptTemplate: string,
  config: PromptReplacementConfig = {},
): string {
  if (!promptTemplate?.trim()) {
    throw new Error('Prompt template is required');
  }

  const processedPrompt = standardReplacer(promptTemplate, config);

  const remainingPlaceholders = processedPrompt.match(/\$\{[^}]+}/g);
  if (remainingPlaceholders?.length) {
    throw new Error(
      `Unreplaced placeholders found: ${remainingPlaceholders.join(', ')}`,
    );
  }

  return processedPrompt;
}
