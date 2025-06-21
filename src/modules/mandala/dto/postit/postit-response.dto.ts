import { TagResponseDto } from "@/modules/project/dto/tag-response.dto";

export class PostitResponseDto {
    id!: string;
    content!: string;
    dimension!: string;
    section!: string;
    tags!: TagResponseDto[];
    parentId?: string | null;
  }
