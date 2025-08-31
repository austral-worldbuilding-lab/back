import { AiPostitResponse } from '@modules/mandala/types/postits';

import { AiQuestionResponse } from '@/modules/mandala/types/questions';

export interface AiProvider {
  /**
   * Generates postits for a project
   * @param projectId - The ID of the project to generate postits for
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param centerCharacter
   * @param centerCharacterDescription
   * @param tags - Array of tags to be used for connecting postits across dimensions
   * @param selectedFiles - Optional array of file names to filter context
   * @param mandalaId - Optional mandala ID for mandala-specific file context
   * @returns An array of AiPostitResponse objects (with string tags)
   */
  generatePostits(
    projectId: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
    selectedFiles?: string[],
    mandalaId?: string,
  ): Promise<AiPostitResponse[]>;

  /**
   * Generates questions for a project based on mandala configuration and files
   * @param projectId
   * @param mandalaId - The ID of the mandala to generate questions for
   * @param mandalaTextSummary - Clean textual summary of the mandala without technical details
   * Project configuration:
   * @param dimensions - Array of dimensions to generate questions for
   * @param scales - Array of scales to generate questions for
   * @param tags - Array of tags to be used for connecting postits across dimensions
   * Mandala configuration:
   * @param centerCharacter - The center character
   * @param centerCharacterDescription - The center character description
   * @param selectedFiles - Optional array of file names to filter context
   * @returns An array of AiQuestionResponse objects
   */
  generateQuestions(
    projectId: string,
    mandalaId: string,
    mandalaTextSummary: string,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    selectedFiles?: string[],
  ): Promise<AiQuestionResponse[]>;
}
