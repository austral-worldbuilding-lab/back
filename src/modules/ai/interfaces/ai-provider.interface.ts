import { AiMandalaReport } from '@modules/mandala/types/ai-report';
import {
  AiPostitComparisonResponse,
  AiPostitResponse,
} from '@modules/mandala/types/postits';
import { AiQuestionResponse } from '@modules/mandala/types/questions.type';
import { AiProvocationResponse } from '@modules/project/types/provocations.type';
import { AiActionItemResponse } from '@modules/solution/types/action-items.type';
import { AiSolutionResponse } from '@modules/solution/types/solutions.type';

import { AiEncyclopediaResponse } from '../types/ai-encyclopedia-response.type';
import { AiResponseWithUsage } from '../types/ai-response-with-usage.type';

import { AiMandalaImageResponse } from '@/modules/mandala/types/mandala-images.type';

export interface AiProvider {
  /**
   * Generates postits for a project
   * @param projectId - The ID of the project to generate postits for
   * @param projectName - The name of the project (displayed as world name)
   * @param projectDescription - The description of the project (displayed as world description)
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param tags - Array of tags to be used for connecting postits across dimensions
   * @param centerCharacter
   * @param centerCharacterDescription
   * @param selectedFiles - Optional array of file names to filter context
   * @param mandalaId - The ID of the mandala to generate postits for
   * @param isFutureProject - Optional flag to indicate if the project is a future project
   * @returns An array of AiPostitResponse objects (with string tags)
   */
  generatePostits(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    selectedFiles?: string[],
    mandalaId?: string,
    isFutureProject?: boolean,
  ): Promise<AiResponseWithUsage<AiPostitResponse[]>>;

  /**
   * Generates context postits for a project (general aspects not tied to a specific character)
   * @param projectId - The ID of the project to generate postits for
   * @param projectName - The name of the project (displayed as world name)
   * @param projectDescription - The description of the project (displayed as world description)
   * @param dimensions - Array of dimensions
   * @param scales - Array of scales
   * @param tags - Array of tags to be used for connecting postits across dimensions
   * @param centerContext - The center context name
   * @param centerContextDescription - The center context description
   * @param selectedFiles - Optional array of file names to filter context
   * @param mandalaId - The ID of the mandala to generate postits for
   * @param isFutureProject - Optional flag to indicate if the project is a future project
   * @returns An array of AiPostitResponse objects (with string tags)
   */
  generateContextPostits(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    tags: string[],
    centerContext: string,
    centerContextDescription: string,
    selectedFiles?: string[],
    mandalaId?: string,
    isFutureProject?: boolean,
  ): Promise<AiResponseWithUsage<AiPostitResponse[]>>;

  /**
   * Generates questions for a project based on mandala configuration and files
   * @param projectId
   * @param projectName - The name of the project (displayed as world name)
   * @param projectDescription - The description of the project (displayed as world description)
   * @param mandalaId
   * Project configuration:
   * @param dimensions - Array of dimensions to generate questions for
   * @param scales - Array of scales to generate questions for
   * Mandala configuration:
   * @param tags
   * @param centerCharacter - The center character
   * @param centerCharacterDescription - The center character description
   * @param mandalaAiSummary
   * @param selectedFiles - Optional array of file names to filter context
   * @returns An array of AiQuestionResponse objects
   */
  generateQuestions(
    projectId: string,
    projectName: string,
    projectDescription: string,
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
   * @param projectName - The name of the project (displayed as world name)
   * @param projectDescription - The description of the project (displayed as world description)
   * @param dimensions - Array of dimensions to consider during the comparison analysis
   * @param scales - Array of scales to consider during the comparison analysis
   * @param mandalasAiSummary - Document containing the mandalas to be compared
   * @returns Promise resolving to an object containing:
   *          - comparisons: Array of postit comparison responses
   *          - report: Overall analysis report of the mandalas
   */
  generatePostitsSummary(
    projectId: string,
    projectName: string,
    projectDescription: string,
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
   * @param mandalasSummariesWithAi - Summaries of the mandalas generated with AI to be used in the prompt
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
    mandalasSummariesWithAi: string,
    selectedFiles?: string[],
  ): Promise<AiResponseWithUsage<AiProvocationResponse[]>>;

  /**
   * Generates a consolidated summary of a mandala using AI analysis
   *
   * This method takes the configuration, postits, characters, and other context
   * from a mandala and produces a single narrative summary. The AI analyzes the
   * world, dimensions, scales, central character, tensions, insights,
   * and other elements to generate a comprehensive overview.
   *
   * @param projectId - Unique identifier of the project containing the mandala
   * @param mandalaId - Unique identifier of the mandala to summarize
   * @param dimensions - Array of dimension names belonging to the mandala
   * @param scales - Array of scale names belonging to the mandala
   * @param centerCharacter - The main character at the center of the mandala
   * @param centerCharacterDescription - Description of the center character
   * @param cleanMandalaDocument - Serialized mandala document cleaned for AI input
   * @returns Promise resolving to a string containing the consolidated summary
   */
  generateMandalaSummary(
    projectId: string,
    mandalaId: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    cleanMandalaDocument: string,
  ): Promise<string>; //TODO return AiResponseWithUsage<string> to track usage

  /**
   * Generates a comprehensive encyclopedia of the project world using AI analysis
   *
   * This method takes all the mandala summaries from a project and produces a consolidated
   * encyclopedia that serves as a knowledge base for future AI generation of solutions and
   * project chaining. The AI analyzes the world, characters, dimensions, scales, patterns,
   * and insights to generate a comprehensive overview that can be used as input for
   * future AI operations.
   *
   * @param projectId - Unique identifier of the project
   * @param projectName - Name of the project
   * @param projectDescription - Description of the project
   * @param dimensions - Array of dimension names present in the project
   * @param scales - Array of scale names present in the project
   * @param mandalasSummariesWithAi - Consolidated summaries from all project mandalas
   * @param selectedFiles - Optional array of file names to filter context
   * @returns Promise resolving to an encyclopedia response containing the world knowledge
   */
  generateEncyclopedia(
    projectId: string,
    projectName: string,
    projectDescription: string,
    dimensions: string[],
    scales: string[],
    mandalasSummariesWithAi: string,
    selectedFiles?: string[],
  ): Promise<AiResponseWithUsage<AiEncyclopediaResponse>>;

  /**
   * Generates solutions for a project based on its encyclopedia
   *
   * This method takes the project information and its encyclopedia to generate
   * concrete, actionable solutions that address challenges identified in the
   * world. Solutions include title, description, problem statement, impact level,
   * and impact description.
   *
   * @param projectId - Unique identifier of the project
   * @param projectName - Name of the project
   * @param projectDescription - Description of the project
   * @param encyclopedia - Encyclopedia content of the project
   * @returns Promise resolving to an array of solution responses
   */
  generateSolutions(
    projectId: string,
    projectName: string,
    projectDescription: string,
    encyclopedia: string,
  ): Promise<AiResponseWithUsage<AiSolutionResponse[]>>;

  /**
   * Generates action items for a solution
   *
   * This method takes a solution and generates concrete, actionable steps
   * to implement it. Each action item includes an order, title, description,
   * and optional duration.
   *
   * @param projectId - Unique identifier of the project
   * @param projectName - Name of the project
   * @param projectDescription - Description of the project
   * @param solutionTitle - Title of the solution
   * @param solutionDescription - Description of the solution
   * @param solutionProblem - Problem that the solution addresses
   * @returns Promise resolving to an array of action item responses
   */
  generateActionItems(
    projectId: string,
    projectName: string,
    projectDescription: string,
    solutionTitle: string,
    solutionDescription: string,
    solutionProblem: string,
  ): Promise<AiResponseWithUsage<AiActionItemResponse[]>>;

  /**
   * Generates images for a mandala based on its content and context
   *
   * This method takes the mandala information and generates visual representations
   * for specific sections (dimension-scale intersections) of the mandala.
   * Uses only mandala summary and JSON context - no external files.
   *
   * @param projectId - Unique identifier of the project
   * @param projectName - Name of the project
   * @param projectDescription - Description of the project
   * @param mandalaId - Unique identifier of the mandala
   * @param dimensions - Array of dimension names
   * @param scales - Array of scale names
   * @param centerCharacter - Name of the center (character or context)
   * @param centerCharacterDescription - Description of the center
   * @param mandalaDocument - Full mandala JSON context
   * @returns Promise resolving to an array of image responses with base64 data
   */
  generateMandalaImages(
    projectId: string,
    projectName: string,
    projectDescription: string,
    mandalaId: string,
    dimensions: string[],
    scales: string[],
    centerCharacter: string,
    centerCharacterDescription: string,
    mandalaDocument: string,
  ): Promise<AiResponseWithUsage<AiMandalaImageResponse[]>>;
}
