import { AiService, AiModel } from '@prisma/client';

export class Consumption {
  id!: string;
  timestamp!: Date;
  service!: AiService;
  model!: AiModel;
  userId!: string;
  projectId?: string;
  organizationId?: string;
  quantity!: number;
}
