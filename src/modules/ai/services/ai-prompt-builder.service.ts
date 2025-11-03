import * as path from 'path';

import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { ProjProvLinkRole } from '@prisma/client';

import {
  replacePostitPlaceholders,
  replaceQuestionPlaceholders,
  replaceComparisonPlaceholders,
  replaceProvocationPlaceholders,
  replaceMandalaSummaryPlaceholders,
  replaceEncyclopediaPlaceholders,
  replaceContextPostitPlaceholders,
  replaceSolutionPlaceholders,
  replaceMandalaImagesPlaceholders,
  replaceActionItemsPlaceholders,
} from '../utils/prompt-placeholder-replacer';

import { AiAdapterUtilsService } from './ai-adapter-utils.service';

@Injectable()
export class AiPromptBuilderService {
  constructor(
    private readonly utilsService: AiAdapterUtilsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Gets the provocation timeline string for a project
   * @param projectId - The project ID
   * @returns A string like "¿Qué pasaría si...? -> ¿Qué pasaría si en 2040...?" or "N/A"
   */
  private async getProvocationTimelineString(
    projectId: string,
  ): Promise<string> {
    const originLink = await this.prisma.projProvLink.findFirst({
      where: {
        projectId: projectId,
        role: ProjProvLinkRole.ORIGIN,
      },
      include: {
        provocation: {
          select: {
            id: true,
            question: true,
            parentProvocationId: true,
          },
        },
      },
    });

    if (!originLink?.provocation) {
      return 'N/A';
    }

    const provocationQuestions: string[] = [];
    let currentProvocationId: string | null;

    provocationQuestions.unshift(originLink.provocation.question);
    currentProvocationId = originLink.provocation.parentProvocationId;

    while (currentProvocationId) {
      const parentProvocation = await this.prisma.provocation.findUnique({
        where: {
          id: currentProvocationId,
          isActive: true,
        },
        select: {
          question: true,
          parentProvocationId: true,
        },
      });

      if (!parentProvocation) {
        break;
      }

      provocationQuestions.unshift(parentProvocation.question);
      currentProvocationId = parentProvocation.parentProvocationId;
    }

    return provocationQuestions.join(' -> ');
  }

  /**
   * Builds a complete prompt by combining Ciclo 1 instructions with task-specific prompt
   * This is because is better to have a instruction + prompt combined inside SystemInstruction to avoid "Lost in the middle" problem with all context
   * @param taskPrompt - The task-specific prompt content
   * @returns The final prompt with ciclo 1 instructions prepended
   */
  async buildPromptWithCiclo1Instructions(taskPrompt: string): Promise<string> {
    const commonInstruction = await this.utilsService.getCiclo1Instructions();
    return `${commonInstruction}\n\n${taskPrompt}`;
  }

  /**
   * Builds a complete prompt by combining Ciclo 3 instructions with task-specific prompt
   * This is because is better to have a instruction + prompt combined inside SystemInstruction to avoid "Lost in the middle" problem with all context
   * @param taskPrompt - The task-specific prompt content
   * @returns The final prompt with ciclo 3 instructions prepended
   */
  async buildPromptWithCiclo3Instructions(taskPrompt: string): Promise<string> {
    const commonInstruction = await this.utilsService.getCiclo3Instructions();
    return `${commonInstruction}\n\n${taskPrompt}`;
  }

  /**
   * Builds complete prompt for postit generation
   * @param projectId - Project ID for provocation timeline
   * @param projectName - Project name (displayed as world name)
   * @param projectDescription - Project description (displayed as world description)
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param centerCharacter - The center character
   * @param centerCharacterDescription - The center character description
   * @param tags - Array of tags
   * @param isFutureProject - Flag to indicate if the project is a future/hypothetical project
   * @returns Complete prompt ready for AI processing
   */
  async buildPostitPrompt(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
    isFutureProject: boolean = false,
  ): Promise<string> {
    // Choose prompt template based on project type
    const promptFileName = isFutureProject
      ? 'prompt_generar_postits_futuro.txt'
      : 'prompt_generar_postits.txt';

    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts',
      promptFileName,
    );

    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const provocationTimeline =
      await this.getProvocationTimelineString(projectId);
    const promptTask = replacePostitPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      dimensions: dimensions,
      scales: scales,
      centerCharacter: centerCharacter,
      centerCharacterDescription: centerCharacterDescription,
      tags: tags,
      maxPostits: this.utilsService.getMaxPostits(),
      minPostits: this.utilsService.getMinPostits(),
      provocationTimeline: provocationTimeline,
    });

    // Use enhanced instructions for future projects
    if (isFutureProject) {
      return this.buildPromptWithCiclo1FutureInstructions(promptTask);
    }

    return this.buildPromptWithCiclo1Instructions(promptTask);
  }

  /**
   * Builds complete prompt for context postit generation
   * @param projectId - Project ID for provocation timeline
   * @param projectName - Project name (displayed as world name)
   * @param projectDescription - Project description (displayed as world description)
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param centerContext - The center context name
   * @param centerContextDescription - The center context description
   * @param tags - Array of tags
   * @param isFutureProject - Flag to indicate if the project is a future/hypothetical project
   * @returns Complete prompt ready for AI processing
   */
  async buildContextPostitPrompt(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    centerContext: string,
    centerContextDescription: string,
    tags: string[],
    isFutureProject: boolean = false,
  ): Promise<string> {
    // Choose prompt template based on project type
    const promptFileName = isFutureProject
      ? 'prompt_generar_postits_contexto_futuro.txt'
      : 'prompt_generar_postits_contexto.txt';

    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts',
      promptFileName,
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const provocationTimeline =
      await this.getProvocationTimelineString(projectId);
    const promptTask = replaceContextPostitPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      dimensions: dimensions,
      scales: scales,
      centerContext: centerContext,
      centerContextDescription: centerContextDescription,
      tags: tags,
      maxPostits: this.utilsService.getMaxPostits(),
      minPostits: this.utilsService.getMinPostits(),
      provocationTimeline: provocationTimeline,
    });

    // Use enhanced instructions for future projects
    if (isFutureProject) {
      return this.buildPromptWithCiclo1FutureInstructions(promptTask);
    }

    return this.buildPromptWithCiclo1Instructions(promptTask);
  }

  /**
   * Builds a complete prompt by combining Ciclo 1 FUTURE instructions with task-specific prompt
   * This version includes instructions for future/hypothetical projects with creative freedom
   * @param taskPrompt - The task-specific prompt content
   * @returns The final prompt with ciclo 1 future instructions prepended
   */
  async buildPromptWithCiclo1FutureInstructions(
    taskPrompt: string,
  ): Promise<string> {
    const futureInstruction = await this.utilsService.readPromptTemplate(
      path.resolve(
        __dirname,
        '../resources/prompts/instrucciones_ciclo_1_con_futuro.txt',
      ),
    );
    return `${futureInstruction}\n\n${taskPrompt}`;
  }

  /**
   * Builds complete prompt for question generation
   * @param projectId - Project ID for provocation timeline
   * @param projectName - Project name (displayed as world name)
   * @param projectDescription - Project description (displayed as world description)
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param tags - Array of tags
   * @param centerCharacter - The center character
   * @param centerCharacterDescription - The center character description
   * @param mandalaAiSummary - Clean textual summary of the mandala
   * @returns Complete prompt ready for AI processing
   */
  async buildQuestionPrompt(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    mandalaAiSummary: string,
  ): Promise<string> {
    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_generar_preguntas.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const provocationTimeline =
      await this.getProvocationTimelineString(projectId);
    const promptTask = replaceQuestionPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      dimensions: dimensions,
      scales: scales,
      tags: tags,
      centerCharacter: centerCharacter,
      centerCharacterDescription: centerCharacterDescription,
      mandalaDocument: mandalaAiSummary,
      maxQuestions: this.utilsService.getMaxQuestions(),
      minQuestions: this.utilsService.getMinQuestions(),
      provocationTimeline: provocationTimeline,
    });
    return this.buildPromptWithCiclo1Instructions(promptTask);
  }

  /**
   * Builds complete prompt for postit summary generation
   * @param projectName - Project name (displayed as world name)
   * @param projectDescription - Project description (displayed as world description)
   * @param mandalasAiSummary - Document containing the mandalas to be compared
   * @returns Complete prompt ready for AI processing
   */
  async buildPostitSummaryPrompt(
    projectName: string,
    projectDescription: string,
    mandalasAiSummary: string,
  ): Promise<string> {
    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_resumen_postits.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const promptTask = replaceComparisonPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      mandalaDocument: mandalasAiSummary,
      maxResults: this.utilsService.getMaxResults(),
      minResults: this.utilsService.getMinResults(),
    });
    return this.buildPromptWithCiclo1Instructions(promptTask);
  }

  /**
   * Builds complete prompt for provocation generation
   * @param projectId - Project ID for provocation timeline
   * @param projectName
   * @param projectDescription
   * @param mandalasAiSummary - Document containing the mandalas to be compared
   * @param mandalasSummariesWithAi - Summaries of the mandalas generated with AI to be used in the prompt
   * @returns Complete prompt ready for AI processing
   */
  async buildProvocationPrompt(
    projectId: string,
    projectName: string,
    projectDescription: string,
    mandalasAiSummary: string,
    mandalasSummariesWithAi: string,
  ): Promise<string> {
    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_generar_provocaciones.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const provocationTimeline =
      await this.getProvocationTimelineString(projectId);
    const promptTask = replaceProvocationPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      mandalaDocument: mandalasAiSummary,
      mandalasSummariesWithAi: mandalasSummariesWithAi,
      maxResults: this.utilsService.getMaxProvocations(),
      minResults: this.utilsService.getMinProvocations(),
      provocationTimeline: provocationTimeline,
    });
    return this.buildPromptWithCiclo3Instructions(promptTask);
  }

  /** Builds complete prompt for mandala summary generation
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param centerCharacter - The center character
   * @param centerCharacterDescription - The center character description
   * @param mandalaDocument - Clean textual summary of the mandala without technical details
   * @returns Complete prompt ready for AI processing
   */
  async buildMandalaSummaryPrompt(
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    mandalaDocument: string,
  ): Promise<string> {
    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_generar_resumen.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);

    const promptTask = replaceMandalaSummaryPlaceholders(promptTemplate, {
      dimensions: dimensions,
      scales: scales,
      centerCharacter: centerCharacter,
      centerCharacterDescription: centerCharacterDescription,
      mandalaDocument: mandalaDocument,
    });

    return this.buildPromptWithCiclo1Instructions(promptTask);
  }

  /**
   * Builds complete prompt for encyclopedia generation
   * @param projectId - Project ID for provocation timeline
   * @param projectName - Name of the project
   * @param projectDescription - Description of the project
   * @param dimensions - Array of dimensions present in the project
   * @param scales - Array of scales present in the project
   * @param mandalasSummariesWithAi - Consolidated summaries of all mandalas in the project
   * @returns Complete prompt ready for AI processing
   */
  async buildEncyclopediaPrompt(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    mandalasSummariesWithAi: string,
  ): Promise<string> {
    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_generar_enciclopedia.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const provocationTimeline =
      await this.getProvocationTimelineString(projectId);
    const promptTask = replaceEncyclopediaPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      dimensions: dimensions,
      scales: scales,
      mandalasSummariesWithAi: mandalasSummariesWithAi,
      provocationTimeline: provocationTimeline,
    });
    return this.buildPromptWithCiclo1Instructions(promptTask);
  }

  /**
   * Builds complete prompt for solution generation
   * @param projectId - Project ID for provocation timeline
   * @param projectName - Name of the project
   * @param projectDescription - Description of the project
   * @param encyclopedia - Encyclopedia content of the project
   * @returns Complete prompt ready for AI processing
   */
  async buildSolutionPrompt(
    projectId: string,
    projectName: string,
    projectDescription: string,
    encyclopedia: string,
  ): Promise<string> {
    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_generar_soluciones.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const provocationTimeline =
      await this.getProvocationTimelineString(projectId);
    const promptTask = replaceSolutionPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      encyclopedia: encyclopedia,
      maxSolutions: this.utilsService.getMaxSolutions(),
      minSolutions: this.utilsService.getMinSolutions(),
      provocationTimeline: provocationTimeline,
    });
    return this.buildPromptWithCiclo3Instructions(promptTask);
  }

  /**
   *
   */
  async buildActionItemsPrompt(
    projectId: string,
    projectName: string,
    projectDescription: string,
    solution: string,
  ) {
    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_generar_action_items.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const provocationTimeline =
      await this.getProvocationTimelineString(projectId);
    const promptTask = replaceActionItemsPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      solution: solution,
      maxActionItems: this.utilsService.getMaxActionItems(),
      minActionItems: this.utilsService.getMinActionItems(),
      provocationTimeline: provocationTimeline,
    });
    return this.buildPromptWithCiclo3Instructions(promptTask);
  }

  /**
   * Builds complete prompt for mandala images generation
   * @param projectId - Project ID for provocation timeline
   * @param projectName - Project name (displayed as world name)
   * @param projectDescription - Project description (displayed as world description)
   * @param centerCharacter - The center character
   * @param centerCharacterDescription - The center character description
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param mandalaDocument - Full mandala JSON context
   * @returns Complete prompt ready for AI processing
   */
  async buildMandalaImagesPrompt(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    mandalaDocument: string,
  ): Promise<string> {
    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_generar_imagenes_mandala.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const provocationTimeline =
      await this.getProvocationTimelineString(projectId);
    const promptTask = replaceMandalaImagesPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      centerCharacter: centerCharacter,
      centerCharacterDescription: centerCharacterDescription,
      dimensions: dimensions,
      scales: scales,
      mandalaDocument: mandalaDocument,
      provocationTimeline: provocationTimeline,
    });
    return this.buildPromptWithCiclo1Instructions(promptTask);
  }
}
