export interface MandalaImage {
  id: string;
  url: string;
  coordinates: {
    x: number;
    y: number;
  };
  dimension: string;
  section: string;
}

export interface MandalaImageWithPresignedUrl extends MandalaImage {
  presignedUrl?: string;
}

export interface CreateMandalaImageRequest {
  projectId: string;
  mandalaId: string;
  fileName: string;
}

export interface ConfirmMandalaImageRequest {
  id: string;
}
