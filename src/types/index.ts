export interface CallbackLog {
  _id: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  query: Record<string, string>;
  ip: string;
  hitAt: string;
}

export interface LogsResponse {
  success: boolean;
  data: CallbackLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
