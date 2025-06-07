export type Dimension = {
  id: string;
  name: string;
  color: string;
  projectId: string | null;
  mandalaId: string | null;
};

export type CreateDimensionDto = {
  name: string;
  color: string;
};
