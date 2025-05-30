import { FileBuffer } from '../../files/types/file-buffer.interface';
import { Postit } from '../../mandala/types/postits';

export interface AiProvider {
  /**
   * Generates postits for a project and returns them as an array of Postit objects
   * @param projectId - The ID of the project to generate postits for
   * @returns An array of Postit objects
   */
  generatePostits(projectId: string): Promise<Postit[]>;
  
  /**
   * Uploads files to the AI provider
   * @param fileBuffers - Array of file buffers to upload
   * @returns Array of uploaded file references
   */
  uploadFiles(fileBuffers: FileBuffer[]): Promise<any[]>;
}