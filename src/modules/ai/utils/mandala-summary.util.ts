import { FirestoreMandalaDocument } from '@modules/firebase/types/firestore-character.type';

import {
  MandalaAiSummary,
  PostitSummary,
  DimensionSummary,
  ScaleSummary,
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
    scale: postit.section, // section in firestore = scale in our domain
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
      name: mandala?.configuration?.center?.name || 'Unnamed Character',
      description: mandala?.configuration?.center?.description || '',
    },
    dimensions,
    scales,
    totalPostits: postitSummaries.length,
  };
}

