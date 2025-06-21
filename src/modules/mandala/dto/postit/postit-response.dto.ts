import {
  TagResponseDto,
  toTagResponseDto,
} from '@/modules/project/dto/tag-response.dto';
import { PostitWithCoordinates } from '../../types/postits';

export class PostitResponseDto {
  id!: string;
  content!: string;
  dimension!: string;
  section!: string;
  tags!: TagResponseDto[];
  parentId?: string | null;
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
    parentId: postit.parentId,
  };
}
