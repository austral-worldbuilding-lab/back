import { Postit } from '@modules/mandala/types/postits';

export interface AiProvider {
  /**
   * Generates postits for a project and returns them as an array of Postit objects
   * @param projectId - The ID of the project to generate postits for
   * @returns An array of Postit objects
   */
  generatePostits(projectId: string): Promise<Postit[]>;
}
