export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MessageResponse<T> {
  message: string;
  data: T;
}

export interface DataResponse<T> {
  data: T;
}
