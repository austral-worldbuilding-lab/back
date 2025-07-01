import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';

import { CreateTagDto } from '@/modules/project/dto/create-tag.dto';

export class UpdatePostitDto {
  @ApiProperty({
    description: 'Nuevo contenido del post-it',
    example: 'Contenido actualizado del post-it',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'Nueva lista de tags del post-it',
    type: [CreateTagDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateTagDto)
  @IsArray()
  tags!: CreateTagDto[];
}
