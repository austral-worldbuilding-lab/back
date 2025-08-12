import { FirestoreMandalaDocument } from '@modules/firebase/types/firestore-character.type';

import {
  MandalaAiSummary,
  PostitSummary,
  DimensionSummary,
  ScaleSummary,
} from '../types/mandala-summary.interface';

/**
 * Transforms a raw FirestoreMandalaDocument into a clean, AI-readable summary
 * Removes technical details like coordinates and IDs while preserving semantic information
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
export function createMandalaAiSummary(
  document: FirestoreMandalaDocument,
): MandalaAiSummary {
  const postits = document.postits || [];

  const mandala: any = document.mandala || {};

  // Extract post-it summaries without coordinates and technical IDs
  const postitSummaries: PostitSummary[] = postits.map((postit) => ({
    content: postit.content,
    dimension: postit.dimension,
    scale: postit.section, // section in firestore = scale in our domain
    childrenCount: postit.childrens?.length || 0,
  }));

  const configuredDimensions: any[] = mandala.configuration?.dimensions || [];

  const configuredScales: string[] = mandala.configuration?.scales || [];

  // Create dimensions with their post-its
  const dimensions: DimensionSummary[] = configuredDimensions.map(
    (dimension: any) => {
      const dimensionName: string = dimension.name || dimension;
      const dimensionPostits = postitSummaries.filter(
        (p) => p.dimension === dimensionName,
      );
      return {
        name: dimensionName,
        postits: dimensionPostits,
        totalPostits: dimensionPostits.length,
      };
    },
  );

  // Create scales with their post-its
  const scales: ScaleSummary[] = configuredScales.map((scale: string) => {
    const scalePostits = postitSummaries.filter((p) => p.scale === scale);
    return {
      name: scale,
      postits: scalePostits,
      totalPostits: scalePostits.length,
    };
  });

  return {
    centerCharacter: {
      name:
        (mandala.configuration?.center?.name as string) || 'Unnamed Character',

      description: (mandala.configuration?.center?.description as string) || '',
    },
    dimensions,
    scales,
    totalPostits: postitSummaries.length,
  };
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/**
 * Generates a human-readable text summary for AI consumption
 */
export function generateTextualSummary(summary: MandalaAiSummary): string {
  const lines: string[] = [];

  lines.push(`Center Character: ${summary.centerCharacter.name}`);

  if (summary.centerCharacter.description) {
    lines.push(`Character Description: ${summary.centerCharacter.description}`);
  }

  lines.push('');

  // Dimensions analysis with ALL scales shown for each dimension
  summary.dimensions.forEach((dimension) => {
    lines.push(`\n${dimension.name}: ${dimension.totalPostits} post-its`);

    // Show ALL scales for this dimension (even with 0 post-its)
    summary.scales.forEach((scale) => {
      const scalePostits = dimension.postits.filter(
        (p) => p.scale === scale.name,
      );
      lines.push(`  ${scale.name}: ${scalePostits.length} post-its`);
      scalePostits.forEach((postit) => {
        lines.push(`    • ${postit.content}`);
      });
    });
  });

  return lines.join('\n');
}
