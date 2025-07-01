import { PostitWithCoordinates } from '../../types/postits';

import {
  TagResponseDto,
  toTagResponseDto,
} from '@/modules/project/dto/tag-response.dto';

export class PostitResponseDto {
  id!: string;
  content!: string;
  dimension!: string;
  section!: string;
  tags!: TagResponseDto[];
  childrens!: PostitResponseDto[];
}

export function toPostitResponseDto(
  postit: PostitWithCoordinates,
): PostitResponseDto {
  return {
    id: postit.id,
    content: postit.content,
    dimension: postit.dimension,
    section: postit.section,
    tags: postit.tags.map(toTagResponseDto),
    childrens: postit.childrens.map(toPostitResponseDto),
  };
}
