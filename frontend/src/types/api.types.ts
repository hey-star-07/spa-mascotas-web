export interface ApiError {
  status: string;
  code: string;
  message: string;
  errors?: Array<{ campo: string; mensaje: string }>;
}