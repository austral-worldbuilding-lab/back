import { FirestoreMandalaDocument } from '@modules/firebase/types/firestore-character.type';

import {
  MandalaAiSummaryForQuestions,
  PostitSummary,
  DimensionSummary,
  SectionSummary,
} from '../types/mandala-questions-summary.interface';

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
 * Transforms a raw FirestoreMandalaDocument into a clean, AI-readable for better AI understanding to generate questions
 * Removes technical details like coordinates and IDs while preserving semantic information
 */
export function createMandalaAiSummaryForQuestions(
  document: FirestoreMandalaDocument,
): MandalaAiSummaryForQuestions {
  const postits = document.postits || [];
  const mandala = document.mandala as MandalaData | undefined;

  const postitSummaries: PostitSummary[] = postits.map((postit) => ({
    content: postit.content,
    dimension: postit.dimension,
    section: postit.section,
    childrenCount: postit.childrens?.length || 0,
  }));

  const configuredDimensions: MandalaDimension[] =
    mandala?.configuration?.dimensions || [];
  const configuredScales: string[] = mandala?.configuration?.scales || [];

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
