export interface ApiException {
  statusCode: number;
  error: string;
  message: string;
  path?: string;
  method?: string;
  timestamp?: string;
  details?: unknown;
}
