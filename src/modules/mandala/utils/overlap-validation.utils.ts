/**
 * Utility functions for mandala overlap validation
 */

import { BadRequestException } from '@nestjs/common';

import {
  OVERLAP_ERROR_MESSAGES,
  OVERLAP_ERROR_TYPES,
} from '../constants/overlap-error-messages';
import { MandalaDto } from '../dto/mandala.dto';

/**
 * Gets the target project ID for the overlapped mandala (uses the first mandala's project)
 * @param mandalas - Array of mandalas
 * @returns Project ID where the overlapped mandala will be saved
 */
export function getTargetProjectId(mandalas: MandalaDto[]): string {
  if (mandalas.length === 0) {
    throw new Error(
      'At least one mandala is required to determine target project',
    );
  }
  return mandalas[0].projectId;
}

/**
 * Validates that all mandalas have the same dimensions
 * @param mandalas - Array of mandalas to validate
 * @throws BadRequestException if mandalas have different dimensions
 */
export function validateSameDimensions(mandalas: MandalaDto[]): void {
  if (mandalas.length < 2) return; // At least 2 mandalas required

  const firstMandala = mandalas[0];
  const expectedDimensions = [
    ...firstMandala.configuration.dimensions.map((d) => d.name),
  ].sort();

  for (let i = 1; i < mandalas.length; i++) {
    const mandala = mandalas[i];
    const mandalaDimensions = mandala.configuration.dimensions
      .map((d) => d.name)
      .sort();

    if (
      JSON.stringify(expectedDimensions) !== JSON.stringify(mandalaDimensions)
    ) {
      throw new BadRequestException({
        message: OVERLAP_ERROR_MESSAGES.DIMENSION_MISMATCH,
        error: OVERLAP_ERROR_TYPES.DIMENSION_MISMATCH,
        details: {
          mandalaName: mandala.name,
          mandalaId: mandala.id,
          expectedDimensions,
          actualDimensions: mandalaDimensions,
          referenceMandalaName: firstMandala.name,
          referenceMandalaId: firstMandala.id,
        },
      });
    }
  }
}

/**
 * Validates that all mandalas have the same scales
 * @param mandalas - Array of mandalas to validate
 * @throws BadRequestException if mandalas have different scales
 */
export function validateSameScales(mandalas: MandalaDto[]): void {
  if (mandalas.length < 2) return; // At least 2 mandalas required

  const firstMandala = mandalas[0];
  const expectedScales = [...firstMandala.configuration.scales].sort();

  for (let i = 1; i < mandalas.length; i++) {
    const mandala = mandalas[i];
    const mandalaScales = [...mandala.configuration.scales].sort();

    if (JSON.stringify(expectedScales) !== JSON.stringify(mandalaScales)) {
      throw new BadRequestException({
        message: OVERLAP_ERROR_MESSAGES.SCALE_MISMATCH,
        error: OVERLAP_ERROR_TYPES.SCALE_MISMATCH,
        details: {
          mandalaName: mandala.name,
          mandalaId: mandala.id,
          expectedScales,
          actualScales: mandalaScales,
          referenceMandalaName: firstMandala.name,
          referenceMandalaId: firstMandala.id,
        },
      });
    }
  }
}
