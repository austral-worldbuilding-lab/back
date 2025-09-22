import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';

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
}

export class FileSelectionBatchDto {
  @ApiProperty({
    description: 'Array of file selection updates to apply',
    type: [UpdateFileSelectionDto],
    example: [
      { fileName: 'document.pdf', selected: true },
      { fileName: 'image.png', selected: false },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFileSelectionDto)
  selections!: UpdateFileSelectionDto[];
}
