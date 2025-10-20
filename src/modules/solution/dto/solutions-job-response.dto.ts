import { ApiProperty } from '@nestjs/swagger';

export class SolutionsJobResponseDto {
  @ApiProperty({
    description: 'The ID of the queued job',
    example: 'solutions-abc123-1234567890',
  })
  jobId!: string;

  @ApiProperty({
    description: 'Message about the job status',
    example: 'Solutions generation job has been queued',
  })
  message!: string;
}
