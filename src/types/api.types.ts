// src/types/api.types.ts

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchParams extends PaginationParams, SortParams {
  search?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

export interface GetDevicesParams extends SearchParams {
  status?: string;
  userId?: string;
}

export interface CreateDeviceRequest {
  name: string;
  phoneNumber: string;
}

export interface DeviceQRResponse {
  qrCode: string;
  expiresAt: string;
}

export interface SendMessageRequest {
  deviceId: string;
  toNumber: string;
  message: string;
  scheduledAt?: string;
}

export interface SendBulkMessageRequest {
  deviceId: string;
  contacts: Array<{
    phoneNumber: string;
    name?: string;
  }>;
  message: string;
  useRoundRobin?: boolean;
}

export interface GetMessagesParams extends SearchParams {
  deviceId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface ImportContactsRequest {
  file: File;
  userId: string;
}

export interface ImportContactsResponse {
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export interface GetStatsParams {
  startDate?: string;
  endDate?: string;
  deviceId?: string;
}

export interface StatsResponse {
  totalMessages: number;
  sentMessages: number;
  failedMessages: number;
  successRate: number;
  deviceStats: Array<{
    deviceId: string;
    deviceName: string;
    messageCount: number;
    successRate: number;
  }>;
  hourlyStats: Array<{
    hour: string;
    count: number;
  }>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiError {
  validationErrors: ValidationError[];
}
