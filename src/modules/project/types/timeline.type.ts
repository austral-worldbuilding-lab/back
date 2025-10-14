export type NodeType = 'project';
export type EdgeType = 'PROJECT_PARENT';

export interface NodeBase {
  id: string;
  type: NodeType;
  createdAt: string;
  label?: string;
  isHighlighted?: boolean; // marks only the requested project node
}

export interface ProjectNode extends NodeBase {
  name: string;
  description?: string;
  parentId: string | null;
  depth?: number;
  originQuestion?: string | null;
}

export interface Edge {
  from: string;
  to: string;
  type: EdgeType;
  createdAt?: string;
}

export interface TimelineGraph {
  nodes: Array<ProjectNode>;
  edges: Edge[];
}
