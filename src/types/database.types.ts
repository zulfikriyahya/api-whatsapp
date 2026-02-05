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

export enum MessageDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
}

export interface Device {
  id: string;
  name: string;
  phone_number: string;
  status: DeviceStatus;
  is_ready: boolean;
  user_id: string;
  last_seen: Date | null;
  created_at: Date;
}

export interface Message {
  id: string;
  device_id: string;
  user_id: string;
  to_number: string;
  message: string;
  media_url?: string | null;
  media_type?: "image" | "video" | "audio" | "document" | null;
  caption?: string | null;
  direction: MessageDirection;
  from_number: string | null;
  status: MessageStatus;
  retry_count: number;
  error_message: string | null;
  created_at: Date;
  sent_at: Date | null;
}

export interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email?: string | null;
  tags?: string[] | null;
  user_id: string;
  created_at: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables?: Record<string, string> | null;
  user_id: string;
  created_at: Date;
}

export interface AutoResponseRule {
  id: string;
  keyword: string;
  response: string;
  device_id: string;
  priority: number;
  is_active: boolean;
  created_at: Date;
}

export interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  user_id: string;
  is_active: boolean;
  last_used?: Date | null;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface DashboardStats {
  total_devices: number;
  active_devices: number;
  total_messages_today: number;
  success_rate: number;
  total_messages_sent: number;
  total_messages_failed: number;
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
  message?: string;
  media_path?: string;
  media_type?: "image" | "video" | "audio" | "document";
}

export interface CreateContactDTO {
  name: string;
  phone_number: string;
  email?: string | null;
  tags?: string[] | null;
  user_id: string;
}

export interface DeviceViewModel extends Device {
  message_count?: number;
  last_message_at?: Date;
}
