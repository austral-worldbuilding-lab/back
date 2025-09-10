import { FirestoreMandalaDocument } from '@modules/firebase/types/firestore-character.type';

import {
  CleanMandalaForQuestions,
  PostitWithCount,
  DimensionWithCount,
  ScaleWithCount,
  CleanMandalaForSummary,
  PostitClean,
  DimensionClean,
  ScaleClean,
} from '../types/mandala-cleaned-for-ai.interface';

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
 * Transforms a raw FirestoreMandalaDocument into a clean, AI-readable summary for better AI understanding to generate questions
 * Removes technical details like coordinates and IDs while preserving semantic information
 */
export function createCleanMandalaForQuestions(
  document: FirestoreMandalaDocument,
): CleanMandalaForQuestions {
  const postits = document.postits || [];
  const mandala = document.mandala as MandalaData | undefined;

  const postitSummaries: PostitWithCount[] = postits.map((postit) => ({
    content: postit.content,
    dimension: postit.dimension,
    scale: postit.section,
    childrenCount: postit.childrens?.length || 0,
  }));

  const configuredDimensions: MandalaDimension[] =
    mandala?.configuration?.dimensions || [];
  const configuredScales: string[] = mandala?.configuration?.scales || [];

  const dimensions: DimensionWithCount[] = configuredDimensions.map(
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

  const sections: ScaleWithCount[] = configuredScales.map((scale: string) => {
    const scalePostits = postitSummaries.filter((p) => p.scale === scale);
    return {
      name: scale,
      postits: scalePostits,
      totalPostits: scalePostits.length,
    };
  });

  return {
    centerCharacter: {
      name: mandala!.configuration!.center.name,
      description: mandala?.configuration?.center?.description || '',
    },
    dimensions,
    scales: sections,
    totalPostits: postitSummaries.length,
  };
}

/**
 * Transforms a raw FirestoreMandalaDocument into a clean, AI-readable summary for comparison/summary generation
 * Similar to createMandalaForQuestions but excludes count information that's not needed for summaries
 */
export function createCleanMandalaForSummary(
  document: FirestoreMandalaDocument,
): CleanMandalaForSummary {
  const postits = document.postits || [];
  const mandala = document.mandala as MandalaData | undefined;

  const postitSummaries: PostitClean[] = postits.map((postit) => ({
    content: postit.content,
    dimension: postit.dimension,
    scale: postit.section,
  }));

  const configuredDimensions: MandalaDimension[] =
    mandala?.configuration?.dimensions || [];
  const configuredScales: string[] = mandala?.configuration?.scales || [];

  const dimensions: DimensionClean[] = configuredDimensions.map(
    (dimension: MandalaDimension) => {
      const dimensionPostits = postitSummaries.filter(
        (p) => p.dimension === dimension.name,
      );
      return {
        name: dimension.name,
        postits: dimensionPostits,
      };
    },
  );

  const sections: ScaleClean[] = configuredScales.map((scale: string) => {
    const scalePostits = postitSummaries.filter((p) => p.scale === scale);
    return {
      name: scale,
      postits: scalePostits,
    };
  });

  return {
    centerCharacter: {
      name: mandala!.configuration!.center.name,
      description: mandala?.configuration?.center?.description || '',
    },
    dimensions,
    scales: sections,
  };
}
