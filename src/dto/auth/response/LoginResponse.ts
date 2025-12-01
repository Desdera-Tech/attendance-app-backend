export interface LoginResponse<T> {
  data?: T;
  accessToken: string;
  refreshToken: string;
}
