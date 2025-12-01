export interface ApiResponse<T> {
  name?: string;
  data?: T | null;
  success: boolean;
  statusCode: number;
  message: string | null;
}
