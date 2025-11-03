import { Test, TestingModule } from '@nestjs/testing';

import { AiAdapterUtilsService } from '@modules/ai/services/ai-adapter-utils.service';
import { AiPromptBuilderService } from '@modules/ai/services/ai-prompt-builder.service';
import { PrismaService } from '@modules/prisma/prisma.service';

/**
 * Test de Integración: buildActionItemsPrompt
 *
 * Objetivo: Validar que el flujo completo de generación del prompt de action items
 * funcione correctamente, incluyendo la lectura del template real desde el filesystem
 * y el reemplazo correcto de todos los placeholders.
 */
describe('AiPromptBuilderService - buildActionItemsPrompt (Integration)', () => {
  let service: AiPromptBuilderService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    // Configurar el módulo de testing con providers simplificados
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiPromptBuilderService,
        {
          // Mock de AiAdapterUtilsService
          provide: AiAdapterUtilsService,
          useValue: {
            // Lee el template real del filesystem
            readPromptTemplate: async (path: string) => {
              const fs = await import('fs/promises');
              return fs.readFile(path, 'utf-8');
            },
            // Retorna instrucciones de Ciclo 3
            getCiclo3Instructions: () => {
              return Promise.resolve(
                'Instrucciones de Ciclo 3: Generar soluciones creativas.',
              );
            },
            // Límites configurados
            getMaxActionItems: () => 9,
            getMinActionItems: () => 1,
          },
        },
        {
          // Mock de PrismaService
          provide: PrismaService,
          useValue: {
            projProvLink: {
              findFirst: jest.fn().mockResolvedValue(null),
            },
            provocation: {
              findUnique: jest.fn().mockResolvedValue(null),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AiPromptBuilderService>(AiPromptBuilderService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('debe generar el prompt correctamente con el template real', async () => {
    // ARRANGE - Datos de prueba simples
    const projectId = 'test-project';
    const projectName = 'Proyecto Test';
    const projectDescription = 'Descripción del proyecto test';
    const solution = JSON.stringify({
      title: 'Solución de Prueba',
      description: 'Una solución para testear',
      problem: 'Problema de prueba',
    });

    // Ejecutar el método
    const prompt = await service.buildActionItemsPrompt(
      projectId,
      projectName,
      projectDescription,
      solution,
    );

    // ASSERT - Verificaciones valiosas

    // 1. Verificar que el prompt existe y tiene contenido
    expect(prompt).toBeDefined();
    expect(prompt.length).toBeGreaterThan(100);

    // 2. Verificar que NO quedan placeholders sin reemplazar
    const unreplacedPlaceholders = prompt.match(/\$\{[^}]+}/g);
    expect(unreplacedPlaceholders).toBeNull();

    // 3. Verificar que TODOS los valores se reemplazaron correctamente
    expect(prompt).toContain('Proyecto Test'); // ${projectName} fue reemplazado
    expect(prompt).toContain('Descripción del proyecto test'); // ${projectDescription} fue reemplazado
    expect(prompt).toContain('Solución de Prueba'); // parte de ${solution}
    expect(prompt).toContain('Una solución para testear'); // parte de ${solution}
    expect(prompt).toContain('Problema de prueba'); // parte de ${solution}

    // 4. Verificar que los límites configurables están presentes
    expect(prompt).toContain('1'); // ${minActionItems} fue reemplazado
    expect(prompt).toContain('9'); // ${maxActionItems} fue reemplazado

    // 5. Verificar que tiene TODAS las secciones del template
    expect(prompt).toContain('OBJETIVO:');
    expect(prompt).toContain('CONFIGURACIÓN DEL MUNDO:');
    expect(prompt).toContain('SOLUCIÓN A IMPLEMENTAR:');
    expect(prompt).toContain('CONFIGURACIÓN DE LA GENERACIÓN:');
    expect(prompt).toContain('REGLAS PARA LOS ACTION ITEMS:');
    expect(prompt).toContain('FORMATO DE RESPUESTA:');
    expect(prompt).toContain('EJEMPLO DE USO:');

    // 6. Verificar que contiene las instrucciones de Ciclo 3
    expect(prompt).toContain('Instrucciones de Ciclo 3');

    // 7. Verificar que el formato JSON está especificado
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('"order"');
    expect(prompt).toContain('"title"');
    expect(prompt).toContain('"description"');
    expect(prompt).toContain('"duration"');
  });
});
