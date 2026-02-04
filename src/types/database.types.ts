// src/types/database.types.ts

export enum UserRole {
  ADMIN = "ADMIN",
  USER_A = "USER_A",
  USER_B = "USER_B",
  USER_C = "USER_C",
  DST = "DST",
}

export enum DeviceStatus {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  QR_READY = "QR_READY",
  AUTHENTICATED = "AUTHENTICATED",
  ERROR = "ERROR",
}

export enum MessageStatus {
  PENDING = "PENDING",
  QUEUED = "QUEUED",
  SENDING = "SENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
}

export enum QueueStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Device {
  id: string;
  name: string;
  phone_number: string;
  status: DeviceStatus;
  is_ready: boolean;
  user_id: string;
  session_data: string | null;
  last_seen: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email: string | null;
  tags: string[] | null;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  device_id: string;
  user_id: string;
  to_number: string;
  message: string;
  status: MessageStatus;
  retry_count: number;
  error_message: string | null;
  sent_at: Date | null;
  delivered_at: Date | null;
  read_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: Record<string, string> | null;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface AutoResponseRule {
  id: string;
  keyword: string;
  response: string;
  device_id: string;
  is_active: boolean;
  priority: number;
  created_at: Date;
  updated_at: Date;
}

export interface RateLimit {
  id: string;
  device_id: string;
  messages_count: number;
  window_start: Date;
  window_end: Date;
  is_limited: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKey {
  id: string;
  key_hash: string;
  name: string;
  user_id: string;
  is_active: boolean;
  last_used: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface MessageQueue {
  id: string;
  message_id: string;
  device_id: string;
  priority: number;
  scheduled_at: Date;
  processed_at: Date | null;
  status: QueueStatus;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface CreateUserDTO {
  email: string;
  name: string;
  role?: UserRole;
  password: string;
}

export interface CreateDeviceDTO {
  name: string;
  phone_number: string;
  user_id: string;
}

export interface CreateMessageDTO {
  device_id: string;
  user_id: string;
  to_number: string;
  message: string;
}

// PERBAIKAN: Menambahkan type union | null agar sesuai dengan Zod validation
export interface CreateContactDTO {
  name: string;
  phone_number: string;
  email?: string | null;
  tags?: string[] | null;
  user_id: string;
}

export interface DeviceViewModel extends Device {
  user_name?: string;
  message_count?: number;
  last_message_at?: Date;
}

export interface MessageViewModel extends Message {
  device_name?: string;
  contact_name?: string;
}

export interface DashboardStats {
  total_devices: number;
  active_devices: number;
  total_messages_today: number;
  total_messages_sent: number;
  total_messages_failed: number;
  success_rate: number;
}
