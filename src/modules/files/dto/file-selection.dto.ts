import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsString,
  ValidateNested,
  IsIn,
} from 'class-validator';

export type SourceScope = 'org' | 'project' | 'mandala';

export class UpdateFileSelectionDto {
  @ApiProperty({
    description: 'Name of the file to update selection for',
    example: 'document.pdf',
  })
  @IsString()
  fileName!: string;

  @ApiProperty({
    description: 'Whether the file should be selected or not',
    example: true,
  })
  @IsBoolean()
  selected!: boolean;

  @ApiProperty({
    description: 'Source scope of the file (where it actually exists)',
    example: 'org',
    enum: ['org', 'project', 'mandala'],
  })
  @IsString()
  @IsIn(['org', 'project', 'mandala'])
  sourceScope!: SourceScope;
}

export class FileSelectionBatchDto {
  @ApiProperty({
    description: 'Array of file selection updates to apply',
    type: [UpdateFileSelectionDto],
    example: [
      { fileName: 'document.pdf', selected: true, sourceScope: 'org' },
      { fileName: 'image.png', selected: false, sourceScope: 'project' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFileSelectionDto)
  selections!: UpdateFileSelectionDto[];
}
