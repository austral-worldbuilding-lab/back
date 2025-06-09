import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  projectId: string;
}