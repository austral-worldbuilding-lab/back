import * as path from 'path';

import { Injectable } from '@nestjs/common';

import {
  replacePostitPlaceholders,
  replaceQuestionPlaceholders,
  replaceComparisonPlaceholders,
} from '../utils/prompt-placeholder-replacer';

import { AiAdapterUtilsService } from './ai-adapter-utils.service';

@Injectable()
export class AiPromptBuilderService {
  constructor(private readonly utilsService: AiAdapterUtilsService) {}

  /**
   * Builds a complete prompt by combining common instructions with task-specific prompt
   * This is because is better to have a instruction + prompt combined inside SystemInstruction to avoid "Lost in the middle" problem with all context
   * @param taskPrompt - The task-specific prompt content
   * @returns The final prompt with common instructions prepended
   */
  async buildPromptWithCommonInstructions(taskPrompt: string): Promise<string> {
    const commonInstruction = await this.utilsService.getCommonInstructions();
    return `${commonInstruction}\n\n${taskPrompt}`;
  }

  /**
   * Builds complete prompt for postit generation
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param centerCharacter - The center character
   * @param centerCharacterDescription - The center character description
   * @param tags - Array of tags
   * @returns Complete prompt ready for AI processing
   */
  async buildPostitPrompt(
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
      dimensions: dimensions,
      scales: scales,
      centerCharacter: centerCharacter,
      centerCharacterDescription: centerCharacterDescription,
      tags: tags,
      maxResults: this.utilsService.getMaxResults(),
      minResults: this.utilsService.getMinResults(),
    });
    return this.buildPromptWithCommonInstructions(promptTask);
  }

  /**
   * Builds complete prompt for question generation
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param tags - Array of tags
   * @param centerCharacter - The center character
   * @param centerCharacterDescription - The center character description
   * @param mandalaAiSummary - Clean textual summary of the mandala
   * @returns Complete prompt ready for AI processing
   */
  async buildQuestionPrompt(
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
      dimensions: dimensions,
      scales: scales,
      tags: tags,
      centerCharacter: centerCharacter,
      centerCharacterDescription: centerCharacterDescription,
      mandalaDocument: mandalaAiSummary,
      maxResults: this.utilsService.getMaxResults(),
      minResults: this.utilsService.getMinResults(),
    });
    return this.buildPromptWithCommonInstructions(promptTask);
  }

  /**
   * Builds complete prompt for postit summary generation
   * @param mandalasAiSummary - Document containing the mandalas to be compared
   * @returns Complete prompt ready for AI processing
   */
  async buildPostitSummaryPrompt(mandalasAiSummary: string): Promise<string> {
    const promptFilePath = path.resolve(
      __dirname,
      '../resources/prompts/prompt_resumen_postits.txt',
    );
    const promptTemplate =
      await this.utilsService.readPromptTemplate(promptFilePath);
    const promptTask = replaceComparisonPlaceholders(promptTemplate, {
      mandalaDocument: mandalasAiSummary,
      maxResults: this.utilsService.getMaxResults(),
      minResults: this.utilsService.getMinResults(),
    });
    return this.buildPromptWithCommonInstructions(promptTask);
  }
}
