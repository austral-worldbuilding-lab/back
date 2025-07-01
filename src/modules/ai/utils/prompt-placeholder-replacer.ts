/**
 * Reemplaza los placeholders dinámicos en el prompt de mandala inicial
 * @returns El prompt con todos los placeholders reemplazados
 */
export function replacePromptPlaceholders(
  promptTemplate: string,
  dimensions: string[],
  scales: string[],
  centerCharacter: string,
  centerCharacterDescription: string,
  tags: string[],
): string {
  if (!promptTemplate) throw new Error('Prompt template is required');
  if (!dimensions?.length)
    throw new Error('At least one dimension must be provided');
  if (!scales?.length) throw new Error('At least one scale must be provided');
  if (!centerCharacter?.trim())
    throw new Error('Center character must be provided');
  if (!centerCharacterDescription?.trim())
    throw new Error('Center character description must be provided');

  dimensions.forEach((dim, i) => {
    if (!dim?.trim())
      throw new Error(`Dimension at index ${i} must be a valid string`);
  });

  scales.forEach((scale, i) => {
    if (!scale?.trim())
      throw new Error(`Scale at index ${i} must be a valid string`);
  });

  tags.forEach((tag, i) => {
    if (!tag?.trim())
      throw new Error(`Tag at index ${i} must be a valid string`);
  });

  const processedPrompt = promptTemplate
    .replace(/\$\{dimensions}/g, dimensions.join(', '))
    .replace(/\$\{scales}/g, scales.join(', '))
    .replace(/\$\{centerCharacter}/g, centerCharacter)
    .replace(/\$\{centerCharacterDescription}/g, centerCharacterDescription)
    .replace(/\$\{tags}/g, tags.join(', '));

  const remainingPlaceholders = processedPrompt.match(/\$\{[^}]+}/g);
  if (remainingPlaceholders?.length) {
    throw new Error(
      `Unreplaced placeholders found: ${remainingPlaceholders.join(', ')}`,
    );
  }

  return processedPrompt;
}
