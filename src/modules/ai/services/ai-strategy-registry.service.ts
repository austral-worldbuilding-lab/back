import { Injectable } from '@nestjs/common';

import { ActionItemsStrategy } from '../strategies/action-items.strategy';
import { ContextPostitsStrategy } from '../strategies/context-postits.strategy';
import { EncyclopediaStrategy } from '../strategies/encyclopedia.strategy';
import { MandalaImagesStrategy } from '../strategies/mandala-images.strategy';
import { MandalaSummaryStrategy } from '../strategies/mandala-summary.strategy';
import { PostitsSummaryStrategy } from '../strategies/postits-summary.strategy';
import { PostitsStrategy } from '../strategies/postits.strategy';
import { ProvocationsStrategy } from '../strategies/provocations.strategy';
import { QuestionsStrategy } from '../strategies/questions.strategy';
import { SolutionImagesStrategy } from '../strategies/solution-images.strategy';
import { SolutionsStrategy } from '../strategies/solutions.strategy';

@Injectable()
export class AiStrategyRegistryService {
  constructor(
    private readonly postits: PostitsStrategy,
    private readonly contextPostits: ContextPostitsStrategy,
    private readonly questions: QuestionsStrategy,
    private readonly postitsSummary: PostitsSummaryStrategy,
    private readonly provocations: ProvocationsStrategy,
    private readonly encyclopedia: EncyclopediaStrategy,
    private readonly mandalaSummary: MandalaSummaryStrategy,
    private readonly solutions: SolutionsStrategy,
    private readonly mandalaImages: MandalaImagesStrategy,
    private readonly actionItems: ActionItemsStrategy,
    private readonly solutionImages: SolutionImagesStrategy,
  ) {}

  getPostits() {
    return this.postits;
  }
  getContextPostits() {
    return this.contextPostits;
  }
  getQuestions() {
    return this.questions;
  }
  getPostitsSummary() {
    return this.postitsSummary;
  }
  getProvocations() {
    return this.provocations;
  }
  getEncyclopedia() {
    return this.encyclopedia;
  }
  getMandalaSummary() {
    return this.mandalaSummary;
  }
  getSolutions() {
    return this.solutions;
  }
  getActionItems() {
    return this.actionItems;
  }
  getMandalaImages() {
    return this.mandalaImages;
  }
  getSolutionImages() {
    return this.solutionImages;
  }
}
