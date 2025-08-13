import { BusinessLogicException } from '@common/exceptions/custom-exceptions';

import { MandalaDto } from '../dto/mandala.dto';

/**
 * Auto-fills missing dimensions and scales from mandala configuration with validation
 * @param mandala - The mandala configuration
 * @param dimensions - Optional dimensions array. If not provided or empty, uses all mandala dimensions
 * @param scales - Optional scales array. If not provided or empty, uses all mandala scales
 * @returns Object with effectiveDimensions and effectiveScales
 * @throws BusinessLogicException if provided dimensions or scales don't exist in mandala configuration
 */
export function getEffectiveDimensionsAndScales(
  mandala: MandalaDto,
  dimensions?: string[],
  scales?: string[],
): {
  effectiveDimensions: string[];
  effectiveScales: string[];
} {
  const availableDimensions = mandala.configuration.dimensions.map(
    (d) => d.name,
  );
  const availableScales = mandala.configuration.scales;

  // Auto-fill or validate dimensions
  let effectiveDimensions: string[];
  if (!dimensions || dimensions.length === 0) {
    effectiveDimensions = availableDimensions;
  } else {
    // Validate that all provided dimensions exist in mandala
    const invalidDimensions = dimensions.filter(
      (dim) => !availableDimensions.includes(dim),
    );
    if (invalidDimensions.length > 0) {
      throw new BusinessLogicException(
        `Invalid dimensions provided: ${invalidDimensions.join(', ')}. Available dimensions: ${availableDimensions.join(', ')}`,
        {
          invalidDimensions,
          availableDimensions,
          mandalaId: mandala.id,
        },
      );
    }
    effectiveDimensions = dimensions;
  }

  // Auto-fill or validate scales
  let effectiveScales: string[];
  if (!scales || scales.length === 0) {
    effectiveScales = availableScales;
  } else {
    // Validate that all provided scales exist in mandala
    const invalidScales = scales.filter(
      (scale) => !availableScales.includes(scale),
    );
    if (invalidScales.length > 0) {
      throw new BusinessLogicException(
        `Invalid scales provided: ${invalidScales.join(', ')}. Available scales: ${availableScales.join(', ')}`,
        {
          invalidScales,
          availableScales,
          mandalaId: mandala.id,
        },
      );
    }
    effectiveScales = scales;
  }

  return {
    effectiveDimensions,
    effectiveScales,
  };
}
