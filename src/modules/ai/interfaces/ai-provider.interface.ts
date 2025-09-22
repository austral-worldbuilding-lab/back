import { AiMandalaReport } from '@modules/mandala/types/ai-report';
import {
  AiPostitComparisonResponse,
  AiPostitResponse,
} from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions.type';
import { AiProvocationResponse } from '@modules/project/types/provocations.type';

import { AiResponseWithUsage } from '../types/ai-response-with-usage.type';

export interface AiProvider {
  /**
   * Generates postits for a project
   * @param projectId - The ID of the project to generate postits for
   * @param mandalaId - The ID of the mandala to generate postits for
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param tags - Array of tags to be used for connecting postits across dimensions
   * @param centerCharacter
   * @param centerCharacterDescription
   * @param selectedFiles - Optional array of file names to filter context
   * @returns An array of AiPostitResponse objects (with string tags)
   */
  generatePostits(
    projectId: string,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    selectedFiles?: string[],
    mandalaId?: string,
  ): Promise<AiResponseWithUsage<AiPostitResponse[]>>;

  /**
   * Generates questions for a project based on mandala configuration and files
   * @param projectId
   * @param mandalaId
   * @param mandalaTextSummary - Clean textual summary of the mandala without technical details
   * Project configuration:
   * @param dimensions - Array of dimensions to generate questions for
   * @param scales - Array of scales to generate questions for
   * Mandala configuration:
   * @param centerCharacter - The center character
   * @param centerCharacterDescription - The center character description
   * @param selectedFiles - Optional array of file names to filter context
   * @returns An array of AiQuestionResponse objects
   */
  generateQuestions(
    projectId: string,
    mandalaId: string,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    mandalaAiSummary: string,
    selectedFiles?: string[],
  ): Promise<AiResponseWithUsage<AiQuestionResponse[]>>;

  /**
   * Generates postit summary between multiple mandalas using AI analysis
   *
   * This method analyzes the provided mandalas document to identify and compare
   * postits across different mandalas, highlighting similarities, differences,
   * and unique characteristics. The AI generates structured comparison responses
   * that can be used for mandala analysis and insights.
   *
   * @param projectId - The unique identifier of the project containing the mandalas
   * @param dimensions - Array of dimensions to consider during the comparison analysis
   * @param scales - Array of scales to consider during the comparison analysis
   * @param mandalasAiSummary - Document containing the mandalas to be compared
   * @returns Promise resolving to an object containing:
   *          - comparisons: Array of postit comparison responses
   *          - report: Overall analysis report of the mandalas
   */
  generatePostitsSummary(
    projectId: string,
    dimensions: string[],
    scales: string[],
    mandalasAiSummary: string,
  ): Promise<
    AiResponseWithUsage<{
      comparisons: AiPostitComparisonResponse[];
      report: AiMandalaReport;
    }>
  >;

  /**
   * Generates provocations for a project
   * @param projectId - The ID of the project to be used in LoadAndValidateFiles //TODO get Files as input to avoid this, just pass mandalaId or projectId for logs
   * @param projectName - The name of the project to be used in the prompt
   * @param projectDescription - The description of the project to be used in the prompt
   * @param dimensions - Array of dimensions to be used in LoadAndValidateFiles //TODO get Files as input to avoid this
   * @param scales - Array of scales to be used in LoadAndValidateFiles //TODO get Files as input to avoid this
   * @param mandalasAiSummary - Document containing the mandalas to be used in the prompt
   * @param selectedFiles - Optional array of file names to filter context
   * @returns Promise resolving to an array of provocation responses
   */
  generateProvocations(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    mandalasAiSummary: string,
    selectedFiles?: string[],
  ): Promise<AiResponseWithUsage<AiProvocationResponse[]>>;
}
