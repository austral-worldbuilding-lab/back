import { Postit } from '@modules/mandala/types/postits';

export interface AiProvider {
  /**
   * Generates postits for a project and returns them as an array of Postit objects
   * @param projectId - The ID of the project to generate postits for
   * @param dimensions - Array of dimensions to use in the prompt
   * @param scales - Array of scales to use in the prompt
   * @param centerCharacter - The central character for the worldbuilding context
   * @param centerCharacterDescription - Description of the central character
   * @param tags - Array of tags to be used for connecting postits across dimensions
   * @returns An array of Postit objects
   */
  generatePostits(
    projectId: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    tags: string[],
  ): Promise<Postit[]>;
}
