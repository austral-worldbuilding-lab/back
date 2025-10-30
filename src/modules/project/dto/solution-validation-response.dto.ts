import { ApiProperty } from '@nestjs/swagger';

export class ValidationItemDto {
  @ApiProperty({
    description: 'Indicates if this validation requirement is met',
    example: true,
  })
  isValid!: boolean;

  @ApiProperty({
    description: 'Descriptive message about the validation status',
    example: 'Project has a valid description',
  })
  message!: string;

  @ApiProperty({
    description: 'Current value for this validation',
    example: 5,
    required: false,
  })
  currentValue?: number;

  @ApiProperty({
    description: 'Required value for this validation',
    example: 5,
    required: false,
  })
  requiredValue?: number;
}

export class SolutionValidationResponseDto {
  @ApiProperty({
    description: 'Overall validation status - true if all validations pass',
    example: true,
  })
  isValid!: boolean;

  @ApiProperty({
    description:
      'Summary message explaining why solutions cannot be generated (only present when isValid is false)',
    example:
      'Cannot generate solutions: Project needs 3 more mandalas and 2 more files',
    required: false,
  })
  reason?: string;

  @ApiProperty({
    description:
      'List of missing requirements (only present when isValid is false)',
    example: [
      'Project needs 3 more mandalas (currently 2, required 5)',
      'Project needs 3 more files (currently 7, required 10)',
    ],
    type: [String],
    required: false,
  })
  missingRequirements?: string[];

  @ApiProperty({
    description: 'Validation status for project description',
    type: ValidationItemDto,
  })
  description!: ValidationItemDto;

  @ApiProperty({
    description: 'Validation status for project dimensions',
    type: ValidationItemDto,
  })
  dimensions!: ValidationItemDto;

  @ApiProperty({
    description: 'Validation status for project scales',
    type: ValidationItemDto,
  })
  scales!: ValidationItemDto;

  @ApiProperty({
    description: 'Validation status for minimum number of mandalas',
    type: ValidationItemDto,
  })
  mandalas!: ValidationItemDto;

  @ApiProperty({
    description:
      'Validation status for minimum number of postits across all mandalas',
    type: ValidationItemDto,
  })
  postits!: ValidationItemDto;

  @ApiProperty({
    description: 'Validation status for minimum number of files',
    type: ValidationItemDto,
  })
  files!: ValidationItemDto;
}
