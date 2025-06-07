import { replacePromptPlaceholders } from './prompt-placeholder-replacer';

describe('replacePromptPlaceholders', () => {
  const mockPromptTemplate = `
    Utiliza estas dimensiones: \${dimensions}
    Trabaja con estas escalas: \${scales}
    Nunca inventes nuevas dimensiones ni escalas fuera de las proporcionadas.
  `;

  const validDimensions = ['Recursos', 'Cultura', 'Economía'];
  const validScales = ['Persona', 'Comunidad', 'Institución'];

  it('should successfully replace all placeholders with valid data', () => {
    const result = replacePromptPlaceholders(
      mockPromptTemplate,
      validDimensions,
      validScales,
    );

    expect(result).toContain('Recursos, Cultura, Economía');
    expect(result).toContain('Persona, Comunidad, Institución');
    expect(result).not.toContain('${dimensions}');
    expect(result).not.toContain('${scales}');
  });

  it('should handle single dimension and scale', () => {
    const result = replacePromptPlaceholders(
      mockPromptTemplate,
      ['Recursos'],
      ['Persona'],
    );

    expect(result).toContain('Recursos');
    expect(result).toContain('Persona');
  });

  it('should throw error when prompt template is empty', () => {
    expect(() => {
      replacePromptPlaceholders('', validDimensions, validScales);
    }).toThrow('Prompt template is required');
  });

  it('should throw error when dimensions array is empty', () => {
    expect(() => {
      replacePromptPlaceholders(mockPromptTemplate, [], validScales);
    }).toThrow('At least one dimension must be provided');
  });

  it('should throw error when scales array is empty', () => {
    expect(() => {
      replacePromptPlaceholders(mockPromptTemplate, validDimensions, []);
    }).toThrow('At least one scale must be provided');
  });

  it('should throw error when dimension is empty string', () => {
    expect(() => {
      replacePromptPlaceholders(mockPromptTemplate, [''], validScales);
    }).toThrow('Dimension at index 0 must be a valid string');
  });

  it('should throw error when scale is empty string', () => {
    expect(() => {
      replacePromptPlaceholders(mockPromptTemplate, validDimensions, ['']);
    }).toThrow('Scale at index 0 must be a valid string');
  });

  it('should throw error when template contains unreplaced placeholders', () => {
    const templateWithExtraPlaceholder = `
      \${dimensions}
      \${scales}
      \${unknownPlaceholder}
    `;

    expect(() => {
      replacePromptPlaceholders(
        templateWithExtraPlaceholder,
        validDimensions,
        validScales,
      );
    }).toThrow('Unreplaced placeholders found: ${unknownPlaceholder}');
  });

  it('should handle multiple occurrences of same placeholder', () => {
    const templateWithDuplicates = `
      Dimensiones: \${dimensions}
      Usar solo estas dimensiones: \${dimensions}
      Escalas: \${scales}
    `;

    const result = replacePromptPlaceholders(
      templateWithDuplicates,
      validDimensions,
      validScales,
    );

    expect(result).not.toContain('${dimensions}');
    expect(result).not.toContain('${scales}');

    // Should contain the replacement text multiple times
    expect((result.match(/Recursos, Cultura, Economía/g) || []).length).toBe(2);
  });
});
