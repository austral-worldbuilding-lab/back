import { ApiProperty } from '@nestjs/swagger';

export type NodeType = 'project';
export type EdgeType = 'PROJECT_PARENT';

export interface NodeBaseDto {
  id: string;
  type: NodeType;
  createdAt: string;
  label?: string;
  isHighlighted?: boolean;
}

export interface ProjectNodeDto extends NodeBaseDto {
  type: NodeType;
  name: string;
  description?: string;
  parentId: string | null;
  depth?: number;
}

export interface EdgeDto {
  from: string;
  to: string;
  type: EdgeType;
  createdAt?: string;
}

export class TimelineGraphDto {
  @ApiProperty({
    type: [Object],
    description: 'Array of nodes ordered chronologically',
  })
  nodes: Array<ProjectNodeDto> = [];

  @ApiProperty({
    type: [Object],
    description: 'Array of edges connecting nodes',
  })
  edges: EdgeDto[] = [];
}
