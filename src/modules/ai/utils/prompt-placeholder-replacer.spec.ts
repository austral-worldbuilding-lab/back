import {
  replacePostitPlaceholders,
  replaceQuestionPlaceholders,
  replaceComparisonPlaceholders,
} from './prompt-placeholder-replacer';

const validDimensions = ['Recursos', 'Cultura', 'Economía'];
const validScales = ['MI ESQUINA', 'CIUDAD / BARRIO', 'PROVINCIA', 'PAÍS'];
const validCenterCharacter = 'Alumno';
const validCenterCharacterDescription = 'Un alumno generico de la UA';
const validTags = ['educación', 'tecnología'];
const validProjectName = 'Proyecto Test';
const validProjectDescription = 'Un proyecto de prueba para worldbuilding';
const validMandalaDocument =
  'Mandala 1: Sistema UA, Mandala 2: Sistema Educativo';

describe('generatePostitsPromptTemplate', () => {
  const postitPromptTemplate = `
CONFIGURACIÓN DEL MUNDO:
• Nombre del Mundo: \${projectName}
• Descripción del Mundo: \${projectDescription}
• Personaje central: \${centerCharacter}
• Descripción del personaje: \${centerCharacterDescription}
• Dimensiones habilitadas: \${dimensions}
• Escalas habilitadas: \${scales}
• Etiquetas disponibles: \${tags}
• Limite maximo de post-its: \${maxPostits}
• Limite minimo de post-its: \${minPostits}
  `;

  it('should successfully replace all postit placeholders with valid data', () => {
    const result = replacePostitPlaceholders(postitPromptTemplate, {
      projectName: validProjectName,
      projectDescription: validProjectDescription,
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: validTags,
      maxPostits: 24,
      minPostits: 6,
    });

    expect(result).toContain('Nombre del Mundo: Proyecto Test');
    expect(result).toContain(
      'Descripción del Mundo: Un proyecto de prueba para worldbuilding',
    );
    expect(result).toContain('Personaje central: Alumno');
    expect(result).toContain(
      'Descripción del personaje: Un alumno generico de la UA',
    );
    expect(result).toContain(
      'Dimensiones habilitadas: Recursos, Cultura, Economía',
    );
    expect(result).toContain(
      'Escalas habilitadas: MI ESQUINA, CIUDAD / BARRIO, PROVINCIA, PAÍS',
    );
    expect(result).toContain('Etiquetas disponibles: educación, tecnología');
    expect(result).toContain('Limite minimo de post-its: 6');
    expect(result).toContain('Limite maximo de post-its: 24');
    expect(result).not.toContain('${');
  });

  it('should handle empty tags array', () => {
    const result = replacePostitPlaceholders(postitPromptTemplate, {
      projectName: validProjectName,
      projectDescription: validProjectDescription,
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: [], // Empty array should replace placeholder with empty string
      maxPostits: 24,
      minPostits: 6,
    });
    expect(result).toContain('Nombre del Mundo: Proyecto Test');
    expect(result).toContain(
      'Descripción del Mundo: Un proyecto de prueba para worldbuilding',
    );
    expect(result).toContain('Personaje central: Alumno');
    expect(result).toContain(
      'Descripción del personaje: Un alumno generico de la UA',
    );
    expect(result).toContain(
      'Dimensiones habilitadas: Recursos, Cultura, Economía',
    );
    expect(result).toContain(
      'Escalas habilitadas: MI ESQUINA, CIUDAD / BARRIO, PROVINCIA, PAÍS',
    );
    expect(result).toContain('Etiquetas disponibles: ');
    expect(result).toContain('Limite minimo de post-its: 6');
    expect(result).toContain('Limite maximo de post-its: 24');
    expect(result).not.toContain('${');
  });

  it('should handle empty character description', () => {
    const result = replacePostitPlaceholders(postitPromptTemplate, {
      projectName: validProjectName,
      projectDescription: validProjectDescription,
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: '',
      tags: validTags,
      maxPostits: 24,
      minPostits: 6,
    });
    expect(result).toContain('Nombre del Mundo: Proyecto Test');
    expect(result).toContain(
      'Descripción del Mundo: Un proyecto de prueba para worldbuilding',
    );
    expect(result).toContain('Personaje central: Alumno');
    expect(result).toContain('Descripción del personaje: ');
    expect(result).toContain(
      'Dimensiones habilitadas: Recursos, Cultura, Economía',
    );
    expect(result).toContain(
      'Escalas habilitadas: MI ESQUINA, CIUDAD / BARRIO, PROVINCIA, PAÍS',
    );
    expect(result).toContain('Etiquetas disponibles: educación, tecnología');
    expect(result).toContain('Limite minimo de post-its: 6');
    expect(result).toContain('Limite maximo de post-its: 24');
    expect(result).not.toContain('${');
  });

  it('should throw if prompt misses a required placeholder (dimensions)', () => {
    const badTemplate = `
CONFIGURACIÓN DEL MUNDO:
• Nombre del Mundo: \${projectName}
• Descripción del Mundo: \${projectDescription}
• Personaje central: \${centerCharacter}
• Descripción del personaje: \${centerCharacterDescription}
• Escalas habilitadas: \${scales}
• Etiquetas disponibles: \${tags}
• Limite maximo de post-its: \${maxPostits}
• Limite minimo de post-its: \${minPostits}
    `;
    expect(() => {
      replacePostitPlaceholders(badTemplate, {
        projectName: validProjectName,
        projectDescription: validProjectDescription,
        dimensions: validDimensions,
        scales: validScales,
        centerCharacter: validCenterCharacter,
        centerCharacterDescription: validCenterCharacterDescription,
        tags: validTags,
        maxResults: 24,
        minResults: 6,
      });
    }).toThrow('Missing placeholder ${dimensions} in prompt');
  });
});

describe('generateQuestionsPromptTemplate', () => {
  const questionPromptTemplate = `
CONFIGURACIÓN DEL MUNDO:
• Nombre del Mundo: \${projectName}
• Descripción del Mundo: \${projectDescription}
• Personaje central: \${centerCharacter}
• Descripción del personaje: \${centerCharacterDescription}
• Dimensiones habilitadas: \${dimensions}
• Escalas habilitadas: \${scales}
• Etiquetas disponibles: \${tags}
• Limite maximo de preguntas: \${maxQuestions}
• Limite minimo de preguntas: \${minQuestions}

Estado actual de la Mandala: \${mandalaDocument}
  `;

  it('should replace all question placeholders with valid data', () => {
    const result = replaceQuestionPlaceholders(questionPromptTemplate, {
      projectName: validProjectName,
      projectDescription: validProjectDescription,
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: validCenterCharacterDescription,
      tags: validTags,
      maxQuestions: 24,
      minQuestions: 6,
      mandalaDocument: validMandalaDocument,
    });

    expect(result).toContain('Nombre del Mundo: Proyecto Test');
    expect(result).toContain(
      'Descripción del Mundo: Un proyecto de prueba para worldbuilding',
    );
    expect(result).toContain('Personaje central: Alumno');
    expect(result).toContain(
      'Descripción del personaje: Un alumno generico de la UA',
    );
    expect(result).toContain(
      'Dimensiones habilitadas: Recursos, Cultura, Economía',
    );
    expect(result).toContain(
      'Escalas habilitadas: MI ESQUINA, CIUDAD / BARRIO, PROVINCIA, PAÍS',
    );
    expect(result).toContain('Etiquetas disponibles: educación, tecnología');
    expect(result).toContain('Limite minimo de preguntas: 6');
    expect(result).toContain('Limite maximo de preguntas: 24');
    expect(result).toContain(
      'Estado actual de la Mandala: Mandala 1: Sistema UA, Mandala 2: Sistema Educativo',
    );
    expect(result).not.toContain('${');
  });

  it('should allow empty centerCharacterDescription and tags and replace to empty', () => {
    const result = replaceQuestionPlaceholders(questionPromptTemplate, {
      projectName: validProjectName,
      projectDescription: validProjectDescription,
      dimensions: validDimensions,
      scales: validScales,
      centerCharacter: validCenterCharacter,
      centerCharacterDescription: '',
      tags: [],
      maxQuestions: 5,
      minQuestions: 2,
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
CONFIGURACIÓN DEL MUNDO:
• Nombre del Mundo: \${projectName}
• Descripción del Mundo: \${projectDescription}
• Personaje central: \${centerCharacter}
• Descripción del personaje: \${centerCharacterDescription}
• Escalas habilitadas: \${scales}
• Etiquetas disponibles: \${tags}
• Limite maximo de preguntas: \${maxQuestions}
• Limite minimo de preguntas: \${minQuestions}

Estado actual de la Mandala
• Contenido existente: \${mandalaDocument}
    `;
    expect(() => {
      replaceQuestionPlaceholders(badTemplate, {
        projectName: validProjectName,
        projectDescription: validProjectDescription,
        dimensions: validDimensions,
        scales: validScales,
        centerCharacter: validCenterCharacter,
        centerCharacterDescription: validCenterCharacterDescription,
        tags: validTags,
        maxQuestions: 24,
        minQuestions: 6,
        mandalaDocument: validMandalaDocument,
      });
    }).toThrow('Missing placeholder ${dimensions} in prompt');
  });
});

describe('generateComparisonPromptTemplate', () => {
  const comparisonPromptTemplate = `
CONFIGURACIÓN DEL MUNDO:
• Nombre del Mundo: \${projectName}
• Descripción del Mundo: \${projectDescription}
• Limite maximo de post-its: \${maxResults}
• Limite minimo de post-its: \${minResults}

Contenido existente en las mandalas para comparar: \${mandalaDocument}
  `;

  it('should replace all comparison placeholders with valid data', () => {
    const result = replaceComparisonPlaceholders(comparisonPromptTemplate, {
      projectName: validProjectName,
      projectDescription: validProjectDescription,
      maxResults: 24,
      minResults: 6,
      mandalaDocument: validMandalaDocument,
    });
    expect(result).toContain('Nombre del Mundo: Proyecto Test');
    expect(result).toContain(
      'Descripción del Mundo: Un proyecto de prueba para worldbuilding',
    );
    expect(result).toContain('Limite minimo de post-its: 6');
    expect(result).toContain('Limite maximo de post-its: 24');
    expect(result).toContain(
      'Contenido existente en las mandalas para comparar: Mandala 1: Sistema UA, Mandala 2: Sistema Educativo',
    );
    expect(result).not.toContain('${');
  });

  it('should throw if prompt misses a required placeholder (mandalaDocument)', () => {
    const badTemplate = `
CONFIGURACIÓN DEL MUNDO:
• Nombre del Mundo: \${projectName}
• Descripción del Mundo: \${projectDescription}
• Dimensiones habilitadas: \${dimensions}
• Escalas habilitadas: \${scales}
• Limite maximo de post-its: \${maxResults}
• Limite minimo de post-its: \${minResults}
    `;
    expect(() => {
      replaceComparisonPlaceholders(badTemplate, {
        projectName: validProjectName,
        projectDescription: validProjectDescription,
        dimensions: validDimensions,
        scales: validScales,
        maxResults: 24,
        minResults: 6,
        mandalaDocument: validMandalaDocument,
      });
    }).toThrow('Missing placeholder ${mandalaDocument} in prompt');
  });
});
