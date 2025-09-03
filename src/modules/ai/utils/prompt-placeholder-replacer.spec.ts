import { replacePromptPlaceholders } from './prompt-placeholder-replacer';

describe('replacePromptPlaceholders', () => {
  const mockPromptTemplate = `
    Utiliza estas dimensiones: \${dimensions}
    Trabaja con estas escalas: \${scales}
    Personaje central: \${centerCharacter}
    Descripción: \${centerCharacterDescription}
    Etiquetas disponibles: \${tags}
    Nunca inventes nuevas dimensiones ni escalas fuera de las proporcionadas.
    Mandalas a comparar: \${mandalaDocument}
  `;

  const validDimensions = ['Recursos', 'Cultura', 'Economía'];
  const validScales = ['Persona', 'Comunidad', 'Institución'];
  const validCenterCharacter = 'Alumno';
  const validCenterCharacterDescription = 'Un alumno generico de la UA';
  const validTags = ['educación', 'tecnología'];
  const validMandalaDocument =
    'Mandala 1: Sistema UA, Mandala 2: Sistema Educativo';

  it('should successfully replace all placeholders with valid data', () => {
    const result = replacePromptPlaceholders(mockPromptTemplate, {
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: validTags,
      mandalaDocument: validMandalaDocument,
    });

    expect(result).toContain('Recursos, Cultura, Economía');
    expect(result).toContain('Persona, Comunidad, Institución');
    expect(result).toContain('Alumno');
    expect(result).toContain('Un alumno generico de la UA');
    expect(result).toContain('educación, tecnología');
    expect(result).not.toContain('${dimensions}');
    expect(result).not.toContain('${scales}');
    expect(result).not.toContain('${centerCharacter}');
    expect(result).not.toContain('${centerCharacterDescription}');
    expect(result).not.toContain('${mandalaDocument}');
    expect(result).not.toContain('${tags}');
  });

  it('should handle empty tags array', () => {
    const result = replacePromptPlaceholders(mockPromptTemplate, {
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: [], // Empty array should replace placeholder with empty string
      mandalaDocument: validMandalaDocument,
    });

    expect(result).toContain('Recursos, Cultura, Economía');
    expect(result).toContain('Persona, Comunidad, Institución');
    expect(result).toContain('Alumno');
    expect(result).toContain('Un alumno generico de la UA');
    expect(result).toContain('Etiquetas disponibles: '); // Empty string replacement
    expect(result).not.toContain('${tags}'); // Placeholder should be replaced
  });

  it('should handle single dimension and scale', () => {
    const result = replacePromptPlaceholders(mockPromptTemplate, {
      dimensions: ['Recursos'],
      scales: ['Persona'],
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: validTags,
      mandalaDocument: validMandalaDocument,
    });

    expect(result).toContain('Recursos');
    expect(result).toContain('Persona');
    expect(result).toContain('Alumno');
    expect(result).toContain('Un alumno generico de la UA');
  });

  it('should throw error when there are unreplaced placeholders', () => {
    expect(() => {
      replacePromptPlaceholders(mockPromptTemplate, {
        dimensions: validDimensions,
        centerCharacter: validCenterCharacter,
      });
    }).toThrow('Unreplaced placeholders found:');
  });

  it('should not replace placeholders when values are undefined', () => {
    expect(() => {
      replacePromptPlaceholders(mockPromptTemplate, {
        dimensions: validDimensions,
        centerCharacter: validCenterCharacter,
        // scales, centerCharacterDescription, tags, mandalaDocument are undefined
      });
    }).toThrow('Unreplaced placeholders found:');
  });

  it('should throw error when prompt template is empty', () => {
    expect(() => {
      replacePromptPlaceholders('', {
        dimensions: validDimensions,
      });
    }).toThrow('Prompt template is required');
  });

  it('should handle empty dimensions array', () => {
    const result = replacePromptPlaceholders(mockPromptTemplate, {
      dimensions: [],
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: validTags,
      mandalaDocument: validMandalaDocument,
    });

    expect(result).toContain('Utiliza estas dimensiones: '); // Empty string replacement
    expect(result).not.toContain('${dimensions}'); // Placeholder should be replaced
    expect(result).toContain('Persona, Comunidad, Institución');
    expect(result).toContain('Alumno');
  });

  it('should handle empty scales array', () => {
    const result = replacePromptPlaceholders(mockPromptTemplate, {
      dimensions: validDimensions,
      scales: [],
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: validTags,
      mandalaDocument: validMandalaDocument,
    });

    expect(result).toContain('Recursos, Cultura, Economía');
    expect(result).toContain('Trabaja con estas escalas: '); // Empty string replacement
    expect(result).not.toContain('${scales}'); // Placeholder should be replaced
    expect(result).toContain('Alumno');
  });

  it('should handle empty center character', () => {
    const result = replacePromptPlaceholders(mockPromptTemplate, {
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: '',
      centerCharacterDescription: validCenterCharacterDescription,
      tags: validTags,
      mandalaDocument: validMandalaDocument,
    });

    expect(result).toContain('Recursos, Cultura, Economía');
    expect(result).toContain('Persona, Comunidad, Institución');
    expect(result).toContain('Personaje central: '); // Empty string replacement
    expect(result).not.toContain('${centerCharacter}'); // Placeholder should be replaced
  });

  it('should handle empty center character description', () => {
    const result = replacePromptPlaceholders(mockPromptTemplate, {
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: '',
      tags: validTags,
      mandalaDocument: validMandalaDocument,
    });

    expect(result).toContain('Recursos, Cultura, Economía');
    expect(result).toContain('Persona, Comunidad, Institución');
    expect(result).toContain('Alumno');
    expect(result).toContain('Descripción: '); // Empty string replacement
    expect(result).not.toContain('${centerCharacterDescription}'); // Placeholder should be replaced
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
      replacePromptPlaceholders(templateWithExtraPlaceholder, {
        dimensions: validDimensions,
        scales: validScales,
        centerCharacter: validCenterCharacter,
        centerCharacterDescription: validCenterCharacterDescription,
        tags: validTags,
        mandalaDocument: validMandalaDocument,
      });
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

    const result = replacePromptPlaceholders(templateWithDuplicates, {
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: validTags,
      mandalaDocument: validMandalaDocument,
    });

    expect(result).not.toContain('${dimensions}');
    expect(result).not.toContain('${scales}');
    expect(result).not.toContain('${centerCharacter}');
    expect(result).not.toContain('${centerCharacterDescription}');
    expect(result).not.toContain('${tags}');
    expect(result).not.toContain('${mandalaDocument}');
    // Should contain the replacement text multiple times
    expect((result.match(/Recursos, Cultura, Economía/g) || []).length).toBe(2);
    expect((result.match(/Alumno/g) || []).length).toBe(2);
  });
});
