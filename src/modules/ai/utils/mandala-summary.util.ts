import { FirestoreMandalaDocument } from '@modules/firebase/types/firestore-character.type';

import {
  MandalaAiSummary,
  PostitSummary,
  DimensionSummary,
  SectionSummary,
} from '../types/mandala-summary.interface';

// Types for mandala configuration structure
interface MandalaCenter {
  name: string;
  description?: string;
  color: string;
}

interface MandalaDimension {
  name: string;
  color: string;
}

interface MandalaConfiguration {
  center: MandalaCenter;
  dimensions: MandalaDimension[];
  scales: string[];
}

interface MandalaData {
  configuration?: MandalaConfiguration;
  name?: string;
}

/**
 * Transforms a raw FirestoreMandalaDocument into a clean, AI-readable summary
 * Removes technical details like coordinates and IDs while preserving semantic information
 */
export function createMandalaAiSummary(
  document: FirestoreMandalaDocument,
): MandalaAiSummary {
  const postits = document.postits || [];
  const mandala = document.mandala as MandalaData | undefined;

  // Extract post-it summaries without coordinates and technical IDs
  const postitSummaries: PostitSummary[] = postits.map((postit) => ({
    content: postit.content,
    dimension: postit.dimension,
    section: postit.section,
    childrenCount: postit.childrens?.length || 0,
  }));

  const configuredDimensions: MandalaDimension[] =
    mandala?.configuration?.dimensions || [];
  const configuredScales: string[] = mandala?.configuration?.scales || [];

  // Create dimensions with their post-its
  const dimensions: DimensionSummary[] = configuredDimensions.map(
    (dimension: MandalaDimension) => {
      const dimensionPostits = postitSummaries.filter(
        (p) => p.dimension === dimension.name,
      );
      return {
        name: dimension.name,
        postits: dimensionPostits,
        totalPostits: dimensionPostits.length,
      };
    },
  );

  // Create sections with their post-its
  const sections: SectionSummary[] = configuredScales.map((scale: string) => {
    const scalePostits = postitSummaries.filter((p) => p.section === scale);
    return {
      name: scale,
      postits: scalePostits,
      totalPostits: scalePostits.length,
    };
  });

  return {
    centerCharacter: {
      name: mandala?.configuration?.center?.name || 'Unnamed Character',
      description: mandala?.configuration?.center?.description || '',
    },
    dimensions,
    sections,
    totalPostits: postitSummaries.length,
  };
}

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

    // Show ALL sections for this dimension (even with 0 post-its)
    summary.sections.forEach((section) => {
      const sectionPostits = dimension.postits.filter(
        (p) => p.section === section.name,
      );
      lines.push(`  ${section.name}: ${sectionPostits.length} post-its`);
      sectionPostits.forEach((postit) => {
        lines.push(`    • ${postit.content}`);
      });
    });
  });

  return lines.join('\n');
}
