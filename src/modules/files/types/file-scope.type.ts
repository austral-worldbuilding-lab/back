export type FileScope = {
  orgId: string;
  projectId?: string;
  mandalaId?: string;
};

export type FileSource = 'org' | 'project' | 'mandala';

export type EffectiveFile = {
  file_name: string;
  file_type: string;
  source_scope: FileSource;
  full_path: string;
};
