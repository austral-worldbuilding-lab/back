/**
 * Error messages and constants for mandala overlap operations
 */

export const OVERLAP_ERROR_MESSAGES = {
  DIMENSION_MISMATCH: 'Mandalas must have the same dimensions to be overlapped',
  SCALE_MISMATCH: 'Mandalas must have the same scales to be overlapped',
  INSUFFICIENT_MANDALAS:
    'At least 2 mandalas are required for overlap operation',
  OVERLAP_OPERATION_FAILED: 'Failed to overlap mandalas',
} as const;

export const OVERLAP_ERROR_TYPES = {
  DIMENSION_MISMATCH: 'Dimension Mismatch',
  SCALE_MISMATCH: 'Scale Mismatch',
  INSUFFICIENT_MANDALAS: 'Insufficient Mandalas',
  OVERLAP_OPERATION_ERROR: 'Overlap Operation Error',
} as const;

export const OVERLAP_VALIDATION = {
  MIN_MANDALAS: 2, // At least 2 mandalas are required for overlap
} as const;
