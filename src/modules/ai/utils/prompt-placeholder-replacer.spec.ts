import { replacePromptPlaceholders } from './prompt-placeholder-replacer';

describe('replacePromptPlaceholders', () => {
  const mockPromptTemplate = `
    Utiliza estas dimensiones: \${dimensions}
    Trabaja con estas escalas: \${scales}
    Personaje central: \${centerCharacter}
    Descripción: \${centerCharacterDescription}
    Etiquetas disponibles: \${tags}
    Nunca inventes nuevas dimensiones ni escalas fuera de las proporcionadas.
  `;

  const validDimensions = ['Recursos', 'Cultura', 'Economía'];
  const validScales = ['Persona', 'Comunidad', 'Institución'];
  const validCenterCharacter = 'Alumno';
  const validCenterCharacterDescription = 'Un alumno generico de la UA';
  const validTags = ['educación', 'tecnología'];

  it('should successfully replace all placeholders with valid data', () => {
    const result = replacePromptPlaceholders(
      mockPromptTemplate,
      validDimensions,
      validScales,
      validCenterCharacter,
      validCenterCharacterDescription,
      validTags,
    );

    expect(result).toContain('Recursos, Cultura, Economía');
    expect(result).toContain('Persona, Comunidad, Institución');
    expect(result).toContain('Alumno');
    expect(result).toContain('Un alumno generico de la UA');
    expect(result).toContain('educación, tecnología');
    expect(result).not.toContain('${dimensions}');
    expect(result).not.toContain('${scales}');
    expect(result).not.toContain('${centerCharacter}');
    expect(result).not.toContain('${centerCharacterDescription}');
    expect(result).not.toContain('${tags}');
  });

  it('should handle empty tags array', () => {
    const result = replacePromptPlaceholders(
      mockPromptTemplate,
      validDimensions,
      validScales,
      validCenterCharacter,
      validCenterCharacterDescription,
      [],
    );

    expect(result).toContain('Recursos, Cultura, Economía');
    expect(result).toContain('Persona, Comunidad, Institución');
    expect(result).toContain('Alumno');
    expect(result).toContain('Un alumno generico de la UA');
    expect(result).toContain('Etiquetas disponibles: ');
    expect(result).not.toContain('${tags}');
  });

  it('should handle single dimension and scale', () => {
    const result = replacePromptPlaceholders(
      mockPromptTemplate,
      ['Recursos'],
      ['Persona'],
      validCenterCharacter,
      validCenterCharacterDescription,
      validTags,
    );

    expect(result).toContain('Recursos');
    expect(result).toContain('Persona');
    expect(result).toContain('Alumno');
    expect(result).toContain('Un alumno generico de la UA');
  });

  it('should throw error when prompt template is empty', () => {
    expect(() => {
      replacePromptPlaceholders(
        '',
        validDimensions,
        validScales,
        validCenterCharacter,
        validCenterCharacterDescription,
        validTags,
      );
    }).toThrow('Prompt template is required');
  });

  it('should throw error when dimensions array is empty', () => {
    expect(() => {
      replacePromptPlaceholders(
        mockPromptTemplate,
        [],
        validScales,
        validCenterCharacter,
        validCenterCharacterDescription,
        validTags,
      );
    }).toThrow('At least one dimension must be provided');
  });

  it('should throw error when scales array is empty', () => {
    expect(() => {
      replacePromptPlaceholders(
        mockPromptTemplate,
        validDimensions,
        [],
        validCenterCharacter,
        validCenterCharacterDescription,
        validTags,
      );
    }).toThrow('At least one scale must be provided');
  });

  it('should throw error when dimension is empty string', () => {
    expect(() => {
      replacePromptPlaceholders(
        mockPromptTemplate,
        [''],
        validScales,
        validCenterCharacter,
        validCenterCharacterDescription,
        validTags,
      );
    }).toThrow('Dimension at index 0 must be a valid string');
  });

  it('should throw error when scale is empty string', () => {
    expect(() => {
      replacePromptPlaceholders(
        mockPromptTemplate,
        validDimensions,
        [''],
        validCenterCharacter,
        validCenterCharacterDescription,
        validTags,
      );
    }).toThrow('Scale at index 0 must be a valid string');
  });

  it('should throw error when center character is empty', () => {
    expect(() => {
      replacePromptPlaceholders(
        mockPromptTemplate,
        validDimensions,
        validScales,
        '',
        validCenterCharacterDescription,
        validTags,
      );
    }).toThrow('Center character must be provided');
  });

  it('should throw error when center character description is empty', () => {
    expect(() => {
      replacePromptPlaceholders(
        mockPromptTemplate,
        validDimensions,
        validScales,
        validCenterCharacter,
        '',
        validTags,
      );
    }).toThrow('Center character description must be provided');
  });

  it('should throw error when tag is empty string', () => {
    expect(() => {
      replacePromptPlaceholders(
        mockPromptTemplate,
        validDimensions,
        validScales,
        validCenterCharacter,
        validCenterCharacterDescription,
        [''],
      );
    }).toThrow('Tag at index 0 must be a valid string');
  });

  it('should throw error when template contains unreplaced placeholders', () => {
    const templateWithExtraPlaceholder = `
      \${dimensions}
      \${scales}
      \${centerCharacter}
      \${centerCharacterDescription}
      \${tags}
      \${unknownPlaceholder}
    `;

    expect(() => {
      replacePromptPlaceholders(
        templateWithExtraPlaceholder,
        validDimensions,
        validScales,
        validCenterCharacter,
        validCenterCharacterDescription,
        validTags,
      );
    }).toThrow('Unreplaced placeholders found: ${unknownPlaceholder}');
  });

  it('should handle multiple occurrences of same placeholder', () => {
    const templateWithDuplicates = `
      Dimensiones: \${dimensions}
      Usar solo estas dimensiones: \${dimensions}
      Escalas: \${scales}
      Personaje: \${centerCharacter}
      Personaje otra vez: \${centerCharacter}
      Tags: \${tags}
    `;

    const result = replacePromptPlaceholders(
      templateWithDuplicates,
      validDimensions,
      validScales,
      validCenterCharacter,
      validCenterCharacterDescription,
      validTags,
    );

    expect(result).not.toContain('${dimensions}');
    expect(result).not.toContain('${scales}');
    expect(result).not.toContain('${centerCharacter}');
    expect(result).not.toContain('${centerCharacterDescription}');
    expect(result).not.toContain('${tags}');

    // Should contain the replacement text multiple times
    expect((result.match(/Recursos, Cultura, Economía/g) || []).length).toBe(2);
    expect((result.match(/Alumno/g) || []).length).toBe(2);
  });
});
