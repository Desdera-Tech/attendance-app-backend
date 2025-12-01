export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  statusCode: number;
  message: string | null;
}
