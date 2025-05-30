import { FileBuffer } from '../../files/types/file-buffer.interface';

export interface AiProvider {
  /**
   * Generates postits for a project and returns them as a JSON string
   * The JSON string contains a properly formatted array of PostitItem objects
   * @param projectId - The ID of the project to generate postits for
   * @returns A JSON string representing an array of PostitItem objects (already formatted)
   */
  generatePostits(projectId: string): Promise<string>;
  
  /**
   * Uploads files to the AI provider
   * @param fileBuffers - Array of file buffers to upload
   * @returns Array of uploaded file references
   */
  uploadFiles(fileBuffers: FileBuffer[]): Promise<any[]>;
} 