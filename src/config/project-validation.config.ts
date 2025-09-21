export interface ProjectValidationConfig {
  minMandalasForProvocations: number;
  minPostitsForProvocations: number;
  minFilesForProvocations: number;
}

/**
 * Returns project validation configuration with environment variable overrides
 */
export const getProjectValidationConfig = (): ProjectValidationConfig => ({
  minMandalasForProvocations: parseInt(
    process.env.PROJECT_MIN_MANDALAS_FOR_PROVOCATIONS || '5',
  ),
  minPostitsForProvocations: parseInt(
    process.env.PROJECT_MIN_POSTITS_FOR_PROVOCATIONS || '50',
  ),
  minFilesForProvocations: parseInt(
    process.env.PROJECT_MIN_FILES_FOR_PROVOCATIONS || '10',
  ),
});
