import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type NodeType = 'project';
export type EdgeType = 'PROJECT_PARENT';

export class NodeBaseDto {
  @ApiProperty({
    description: 'Unique identifier of the node',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Type of the node',
    enum: ['project'],
    example: 'project',
  })
  type!: NodeType;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt!: string;

  @ApiPropertyOptional({
    description: 'Display label for the node',
    example: 'Campus Sustainability Initiative',
  })
  label?: string;

  @ApiPropertyOptional({
    description: 'Whether this node should be highlighted',
    example: true,
  })
  isHighlighted?: boolean;
}

export class ProjectNodeDto extends NodeBaseDto {
  @ApiProperty({
    description: 'Name of the project',
    example: 'Campus Sustainability Initiative',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Description of the project',
    example: 'A comprehensive project to improve campus sustainability',
  })
  description?: string;

  @ApiProperty({
    description: 'ID of the parent project',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  parentId!: string | null;

  @ApiPropertyOptional({
    description: 'Depth level in the project hierarchy',
    example: 2,
  })
  depth?: number;

  @ApiPropertyOptional({
    description: 'Question from the provocation that originated this project (role ORIGIN)',
    example: '¿Qué pasaría si la universidad creara un espacio dedicado para la celebración de festejos de graduación?',
    nullable: true,
  })
  originQuestion?: string | null;
}

export class EdgeDto {
  @ApiProperty({
    description: 'ID of the source node',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  from!: string;

  @ApiProperty({
    description: 'ID of the target node',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  to!: string;

  @ApiProperty({
    description: 'Type of the edge relationship',
    enum: ['PROJECT_PARENT'],
    example: 'PROJECT_PARENT',
  })
  type!: EdgeType;

  @ApiPropertyOptional({
    description: 'Creation date of the relationship',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt?: string;
}

export class TimelineGraphDto {
  @ApiProperty({
    type: [ProjectNodeDto],
    description: 'Array of project nodes ordered chronologically',
  })
  nodes: ProjectNodeDto[] = [];

  @ApiProperty({
    type: [EdgeDto],
    description: 'Array of edges connecting nodes',
  })
  edges: EdgeDto[] = [];
}
