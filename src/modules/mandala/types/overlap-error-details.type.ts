/**
 * Type definitions for overlap operation error details
 */

export interface DimensionMismatchErrorDetails {
  mandalaName: string;
  mandalaId: string;
  expectedDimensions: string[];
  actualDimensions: string[];
  referenceMandalaName: string;
  referenceMandalaId: string;
}

export interface ScaleMismatchErrorDetails {
  mandalaName: string;
  mandalaId: string;
  expectedScales: string[];
  actualScales: string[];
  referenceMandalaName: string;
  referenceMandalaId: string;
}

export interface InsufficientMandalasErrorDetails {
  mandalaCount: number;
}

export interface OverlapOperationErrorDetails {
  mandalaIds: string[];
  originalError: string;
}

export type OverlapErrorDetails =
  | DimensionMismatchErrorDetails
  | ScaleMismatchErrorDetails
  | InsufficientMandalasErrorDetails
  | OverlapOperationErrorDetails;
