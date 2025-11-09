import { ApiProperty } from '@nestjs/swagger';

import { DeliverableDto } from './deliverable.dto';

export class ProjectDeliverablesResponseDto {
  @ApiProperty({
    description: 'List of project deliverables',
    type: [DeliverableDto],
  })
  deliverables!: DeliverableDto[];
}
