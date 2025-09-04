import {
  replacePostitPlaceholders,
  replaceQuestionPlaceholders,
  replaceComparisonPlaceholders,
} from './prompt-placeholder-replacer';

const validDimensions = ['Recursos', 'Cultura', 'Economía'];
const validScales = ['Persona', 'Comunidad', 'Institución'];
const validCenterCharacter = 'Alumno';
const validCenterCharacterDescription = 'Un alumno generico de la UA';
const validTags = ['educación', 'tecnología'];
const validMandalaDocument =
  'Mandala 1: Sistema UA, Mandala 2: Sistema Educativo';

describe('generatePostitsPromptTemplate', () => {
  const postitPromptTemplate = `
• Personaje central: \${centerCharacter}
• Descripción del personaje: \${centerCharacterDescription}
• Dimensiones habilitadas: \${dimensions}
• Escalas habilitadas: \${scales}
• Etiquetas disponibles: \${tags}
• Limite maximo de post-its: \${maxResults}
• Limite minimo de post-its: \${minResults}
  `;

  it('should successfully replace all postit placeholders with valid data', () => {
    const result = replacePostitPlaceholders(postitPromptTemplate, {
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: validTags,
      maxResults: 24,
      minResults: 6,
    });

    expect(result).toContain('Personaje central: Alumno');
    expect(result).toContain(
      'Descripción del personaje: Un alumno generico de la UA',
    );
    expect(result).toContain(
      'Dimensiones habilitadas: Recursos, Cultura, Economía',
    );
    expect(result).toContain(
      'Escalas habilitadas: Persona, Comunidad, Institución',
    );
    expect(result).toContain('Etiquetas disponibles: educación, tecnología');
    expect(result).toContain('Limite minimo de post-its: 6');
    expect(result).toContain('Limite maximo de post-its: 24');
    expect(result).not.toContain('${');
  });

  it('should handle empty tags array', () => {
    const result = replacePostitPlaceholders(postitPromptTemplate, {
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: [], // Empty array should replace placeholder with empty string
      maxResults: 24,
      minResults: 6,
    });
    expect(result).toContain('Personaje central: Alumno');
    expect(result).toContain(
      'Descripción del personaje: Un alumno generico de la UA',
    );
    expect(result).toContain(
      'Dimensiones habilitadas: Recursos, Cultura, Economía',
    );
    expect(result).toContain(
      'Escalas habilitadas: Persona, Comunidad, Institución',
    );
    expect(result).toContain('Etiquetas disponibles: ');
    expect(result).toContain('Limite minimo de post-its: 6');
    expect(result).toContain('Limite maximo de post-its: 24');
    expect(result).not.toContain('${');
  });

  it('should handle empty empty character description array', () => {
    const result = replacePostitPlaceholders(postitPromptTemplate, {
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: '',
      tags: validTags,
      maxResults: 24,
      minResults: 6,
    });
    expect(result).toContain('Personaje central: Alumno');
    expect(result).toContain('Descripción del personaje: ');
    expect(result).toContain(
      'Dimensiones habilitadas: Recursos, Cultura, Economía',
    );
    expect(result).toContain(
      'Escalas habilitadas: Persona, Comunidad, Institución',
    );
    expect(result).toContain('Etiquetas disponibles: educación, tecnología');
    expect(result).toContain('Limite minimo de post-its: 6');
    expect(result).toContain('Limite maximo de post-its: 24');
    expect(result).not.toContain('${');
  });

  it('should handle empty empty character description array', () => {
    const result = replacePostitPlaceholders(postitPromptTemplate, {
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: '',
      tags: validTags,
      maxResults: 24,
      minResults: 6,
    });
    expect(result).toContain('Personaje central: Alumno');
    expect(result).toContain('Descripción del personaje: ');
    expect(result).toContain(
      'Dimensiones habilitadas: Recursos, Cultura, Economía',
    );
    expect(result).toContain(
      'Escalas habilitadas: Persona, Comunidad, Institución',
    );
    expect(result).toContain('Etiquetas disponibles: educación, tecnología');
    expect(result).toContain('Limite minimo de post-its: 6');
    expect(result).toContain('Limite maximo de post-its: 24');
    expect(result).not.toContain('${');
  });
});

describe('generateQuestionsPromptTemplate', () => {
  const questionPromptTemplate = `
Configuración del proyecto
• Personaje central: \${centerCharacter}
• Descripción del personaje: \${centerCharacterDescription}
• Dimensiones habilitadas: \${dimensions}
• Escalas habilitadas: \${scales}
• Etiquetas disponibles: \${tags}
• Limite maximo de preguntas: \${maxResults}
• Limite minimo de preguntas: \${minResults}

Estado actual de la Mandala: \${mandalaDocument}
  `;

  it('should replace all question placeholders with valid data', () => {
    const result = replaceQuestionPlaceholders(questionPromptTemplate, {
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: validTags,
      maxResults: 24,
      minResults: 6,
      mandalaDocument: validMandalaDocument,
    });

    expect(result).toContain('Personaje central: Alumno');
    expect(result).toContain(
      'Descripción del personaje: Un alumno generico de la UA',
    );
    expect(result).toContain(
      'Dimensiones habilitadas: Recursos, Cultura, Economía',
    );
    expect(result).toContain(
      'Escalas habilitadas: Persona, Comunidad, Institución',
    );
    expect(result).toContain('Etiquetas disponibles: educación, tecnología');
    expect(result).toContain('Limite minimo de preguntas: 6');
    expect(result).toContain('Limite maximo de preguntas: 24');
    expect(result).toContain(
      'Estado actual de la Mandala: Mandala 1: Sistema UA, Mandala 2: Sistema Educativo',
    );
    expect(result).not.toContain('${');
  });

  it('should allow empty tags and centerCharacterDescription and replace to empty', () => {
    const result = replaceQuestionPlaceholders(questionPromptTemplate, {
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: '',
      tags: [],
      maxResults: 5,
      minResults: 2,
      mandalaDocument: validMandalaDocument,
    });

    expect(result).toContain('Descripción del personaje: ');
    expect(result).toContain('Etiquetas disponibles: ');
    expect(result).toContain('Limite minimo de preguntas: 2');
    expect(result).toContain('Limite maximo de preguntas: 5');
    expect(result).not.toContain('${');
  });

  it('should throw if prompt misses a required placeholder (dimensions)', () => {
    const badTemplate = `
Configuración del proyecto
• Personaje central: \${centerCharacter}
• Descripción del personaje: \${centerCharacterDescription}
• Escalas habilitadas: \${scales}
• Etiquetas disponibles: \${tags}
• Limite maximo de preguntas: \${maxResults}
• Limite minimo de preguntas: \${minResults}

Estado actual de la Mandala
• Contenido existente: \${mandalaDocument}
    `;
    expect(() => {
      replaceQuestionPlaceholders(badTemplate, {
        dimensions: validDimensions,
        scales: validScales,
        centerCharacter: validCenterCharacter,
        centerCharacterDescription: validCenterCharacterDescription,
        tags: validTags,
        maxResults: 24,
        minResults: 6,
        mandalaDocument: validMandalaDocument,
      });
    }).toThrow('Missing placeholder ${dimensions} in prompt');
  });
});

describe('generateComparisonPromptTemplate', () => {
  const comparisonPromptTemplate = `
• Limite maximo de post-its: \${maxResults}
• Limite minimo de post-its: \${minResults}

Contenido existente en las mandalas para comparar: \${mandalaDocument}
  `;

  it('should replace comparison placeholders with valid data', () => {
    const result = replaceComparisonPlaceholders(comparisonPromptTemplate, {
      maxResults: 24,
      minResults: 6,
      mandalaDocument: validMandalaDocument,
    });
    expect(result).toContain('Limite minimo de post-its: 6');
    expect(result).toContain('Limite maximo de post-its: 24');
    expect(result).toContain(
      'Contenido existente en las mandalas para comparar: Mandala 1: Sistema UA, Mandala 2: Sistema Educativo',
    );
    expect(result).not.toContain('${');
  });

  it('should throw if prompt misses a required placeholder (mandalaDocument)', () => {
    const badTemplate = `
• Dimensiones habilitadas: \${dimensions}
• Escalas habilitadas: \${scales}
• Limite maximo de post-its: \${maxResults}
• Limite minimo de post-its: \${minResults}
    `;
    expect(() => {
      replaceComparisonPlaceholders(badTemplate, {
        dimensions: validDimensions,
        scales: validScales,
        maxResults: 24,
        minResults: 6,
        mandalaDocument: validMandalaDocument,
      });
    }).toThrow('Missing placeholder ${mandalaDocument} in prompt');
  });
});
