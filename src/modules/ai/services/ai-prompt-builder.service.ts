import * as path from 'path';

import { Injectable } from '@nestjs/common';

import {
  replacePostitPlaceholders,
  replaceQuestionPlaceholders,
  replaceComparisonPlaceholders,
  replaceProvocationPlaceholders,
  replaceMandalaSummaryPlaceholders,
} from '../utils/prompt-placeholder-replacer';

import { AiAdapterUtilsService } from './ai-adapter-utils.service';

@Injectable()
export class AiPromptBuilderService {
  constructor(private readonly utilsService: AiAdapterUtilsService) {}

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
   * @param projectName - Project name (displayed as world name)
   * @param projectDescription - Project description (displayed as world description)
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param centerCharacter - The center character
   * @param centerCharacterDescription - The center character description
   * @param tags - Array of tags
   * @returns Complete prompt ready for AI processing
   */
  async buildPostitPrompt(
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
  ): Promise<string> {
    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_generar_postits.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const promptTask = replacePostitPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      dimensions: dimensions,
      scales: scales,
      centerCharacter: centerCharacter,
      centerCharacterDescription: centerCharacterDescription,
      tags: tags,
      maxResults: this.utilsService.getMaxResults(),
      minResults: this.utilsService.getMinResults(),
    });
    return this.buildPromptWithCiclo1Instructions(promptTask);
  }

  /**
   * Builds complete prompt for question generation
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
    const promptTask = replaceQuestionPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      dimensions: dimensions,
      scales: scales,
      tags: tags,
      centerCharacter: centerCharacter,
      centerCharacterDescription: centerCharacterDescription,
      mandalaDocument: mandalaAiSummary,
      maxResults: this.utilsService.getMaxResults(),
      minResults: this.utilsService.getMinResults(),
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
   * @param projectName
   * @param projectDescription
   * @param mandalasAiSummary - Document containing the mandalas to be compared
   * @param mandalasSummariesWithAi - Summaries of the mandalas generated with AI to be used in the prompt
   * @returns Complete prompt ready for AI processing
   */
  async buildProvocationPrompt(
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
    const promptTask = replaceProvocationPlaceholders(promptTemplate, {
      projectName: projectName,
      projectDescription: projectDescription,
      mandalaDocument: mandalasAiSummary,
      mandalasSummariesWithAi: mandalasSummariesWithAi,
      maxResults: this.utilsService.getMaxProvocations(),
      minResults: this.utilsService.getMinProvocations(),
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
}
