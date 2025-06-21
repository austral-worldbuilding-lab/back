import { PostitTag } from '@/modules/mandala/types/postits';

export class TagResponseDto {
  name!: string;
  color!: string;
}

export function toTagResponseDto(tag: PostitTag): TagResponseDto {
  return {
    name: tag.name,
    color: tag.color,
  };
}
