export interface ProjectValidationConfig {
  minMandalasForSolutions: number;
  minPostitsForSolutions: number;
  minFilesForSolutions: number;
}

/**
 * Returns project validation configuration with environment variable overrides
 */
export const getProjectValidationConfig = (): ProjectValidationConfig => ({
  minMandalasForSolutions: parseInt(
    process.env.PROJECT_MIN_MANDALAS_FOR_SOLUTIONS || '5',
  ),
  minPostitsForSolutions: parseInt(
    process.env.PROJECT_MIN_POSTITS_FOR_SOLUTIONS || '50',
  ),
  minFilesForSolutions: parseInt(
    process.env.PROJECT_MIN_FILES_FOR_SOLUTIONS || '10',
  ),
});
