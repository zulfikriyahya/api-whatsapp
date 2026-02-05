Analisis kode backend berikut dari sisi struktur, keamanan, dan efisiensi. Berikan daftar teknis singkat mengenai poin yang harus diperbaiki (refactoring) dan fitur yang perlu ditambah. Selanjutnya, tuliskan ulang kode final lengkap untuk setiap file yang terdampak.
Ketentuan Output:

- Kode Bersih: Hapus semua komentar penjelasan di dalam kode.
- Format: Tanpa emoticon dan tanpa teks pembuka/penutup yang bertele-tele.
- Data: Gunakan logika dinamis (variabel/database), jangan gunakan hardcoded mockup data.

## BACKEND

### Description

API routes, database, services, authentication, middleware, and server-side logic.

### Path: src/app/api/admin/stats/route.ts

```typescript
// src/app/api/admin/stats/route.ts
import { query, queryOne } from "@/lib/db";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

// Hapus parameter request
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const totalUsers: any = await queryOne(
      "SELECT COUNT(*) as count FROM users",
    );
    const activeUsers: any = await queryOne(
      "SELECT COUNT(*) as count FROM users WHERE is_active = true",
    );
    const totalDevices: any = await queryOne(
      "SELECT COUNT(*) as count FROM devices",
    );
    const activeDevices: any = await queryOne(
      "SELECT COUNT(*) as count FROM devices WHERE status = 'AUTHENTICATED' AND is_ready = true",
    );
    const totalMessages: any = await queryOne(
      "SELECT COUNT(*) as count FROM messages",
    );
    const todayMessages: any = await queryOne(
      "SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = CURDATE()",
    );

    const usersByRole = await query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    const messagesByStatus = await query(`
      SELECT status, COUNT(*) as count
      FROM messages
      GROUP BY status
    `);

    const devicesByStatus = await query(`
      SELECT status, COUNT(*) as count
      FROM devices
      GROUP BY status
    `);

    return successResponse({
      users: {
        total: totalUsers?.count || 0,
        active: activeUsers?.count || 0,
        byRole: usersByRole,
      },
      devices: {
        total: totalDevices?.count || 0,
        active: activeDevices?.count || 0,
        byStatus: devicesByStatus,
      },
      messages: {
        total: totalMessages?.count || 0,
        today: todayMessages?.count || 0,
        byStatus: messagesByStatus,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/admin/users/[userId]/route.ts

```typescript
// src/app/api/admin/users/[userId]/route.ts
import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import {
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

type Params = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const { userId } = await params;
    const body = await _request.json();

    const user = await queryOne("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) {
      return notFoundResponse("User");
    }

    const updates: string[] = [];
    const updateParams: any[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      updateParams.push(body.name);
    }

    if (body.role !== undefined) {
      updates.push("role = ?");
      updateParams.push(body.role);
    }

    if (body.is_active !== undefined) {
      updates.push("is_active = ?");
      updateParams.push(body.is_active);
    }

    if (updates.length === 0) {
      return validationErrorResponse([
        { field: "body", message: "No fields to update" },
      ]);
    }

    updates.push("updated_at = NOW()");
    updateParams.push(userId);

    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      updateParams,
    );

    const updated = await queryOne("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// Gunakan _request karena parameter pertama wajib ada untuk mengakses params
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const { userId } = await params;

    if (userId === session.user.id) {
      return forbiddenResponse("Cannot delete your own account");
    }

    const user = await queryOne("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) {
      return notFoundResponse("User");
    }

    await query("DELETE FROM users WHERE id = ?", [userId]);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/admin/users/route.ts

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest } from "next/server";
import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let sql = `
      SELECT id, email, name, role, is_active, mfa_enabled, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += " AND (email LIKE ? OR name LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const users = await query(sql, params);

    const countResult: any = await queryOne(
      "SELECT COUNT(*) as total FROM users",
    );
    const total = countResult?.total || 0;

    return paginatedResponse(users, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Admin access required");
    }

    const body = await _request.json();

    if (!body.email || !body.name) {
      return validationErrorResponse([
        { field: "email", message: "Email is required" },
        { field: "name", message: "Name is required" },
      ]);
    }

    const existing = await queryOne("SELECT * FROM users WHERE email = ?", [
      body.email,
    ]);

    if (existing) {
      return validationErrorResponse([
        { field: "email", message: "Email already exists" },
      ]);
    }

    const id = uuidv4();
    await query(
      `INSERT INTO users (id, email, name, role, is_active, mfa_enabled)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.email,
        body.name,
        body.role || UserRole.USER_A,
        body.is_active !== undefined ? body.is_active : true,
        false,
      ],
    );

    const user = await queryOne("SELECT * FROM users WHERE id = ?", [id]);

    return successResponse(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/api-keys/[keyId]/route.ts

```typescript
// src/app/api/api-keys/[keyId]/route.ts
import { NextRequest } from "next/server";
import { ApiKeyQueries } from "@/lib/db/queries/api-key.queries";
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    keyId: string;
  }>;
};

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { keyId } = await params;
    const body = await _request.json();

    const apiKey = await ApiKeyQueries.findById(keyId);
    if (!apiKey) {
      return notFoundResponse("API key");
    }

    if (apiKey.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    if (body.is_active !== undefined) {
      await ApiKeyQueries.toggleActive(keyId, body.is_active);
    }

    const updated = await ApiKeyQueries.findById(keyId);
    return successResponse({
      id: updated!.id,
      name: updated!.name,
      is_active: updated!.is_active,
      last_used: updated!.last_used,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// FIX: Ubah request jadi _request
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { keyId } = await params;
    const apiKey = await ApiKeyQueries.findById(keyId);

    if (!apiKey) {
      return notFoundResponse("API key");
    }

    if (apiKey.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await ApiKeyQueries.delete(keyId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/api-keys/route.ts

```typescript
import { NextRequest } from "next/server";
import { ApiKeyQueries } from "@/lib/db/queries/api-key.queries";
import { createApiKeySchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const apiKeys = await ApiKeyQueries.findByUserId(session.user.id);

    return successResponse(
      apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        is_active: key.is_active,
        last_used: key.last_used,
        created_at: key.created_at,
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    const validation = validate(createApiKeySchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const { apiKey, plainKey } = await ApiKeyQueries.create({
      name: validation.data!.name,
      user_id: session.user.id,
    });

    return successResponse(
      {
        id: apiKey.id,
        name: apiKey.name,
        key: plainKey,
        created_at: apiKey.created_at,
        warning: "Save this key securely. It will not be shown again.",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/audit-logs/route.ts

```typescript
// src/app/api/audit-logs/route.ts
import { NextRequest } from "next/server";
import { AuditLogQueries } from "@/lib/db/queries/audit-log.queries";
import {
  handleApiError,
  unauthorizedResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let logs;
    let total;

    if (session.user.role === UserRole.ADMIN) {
      // NOTE: Logic asli dari blueprint menggunakan findByUserId untuk admin juga.
      // Anda mungkin ingin mengubahnya menjadi AuditLogQueries.findAll() nanti jika admin butuh melihat semua log.
      logs = await AuditLogQueries.findByUserId(session.user.id, {
        limit,
        offset,
      });
      total = await AuditLogQueries.countByUser(session.user.id);
    } else {
      logs = await AuditLogQueries.findByUserId(session.user.id, {
        limit,
        offset,
      });
      total = await AuditLogQueries.countByUser(session.user.id);
    }

    return paginatedResponse(logs, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/auth/[...nextauth]/route.ts

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### Path: src/app/api/auth/mfa/disable/route.ts

```typescript
// src/app/api/auth/mfa/disable/route.ts
import { NextRequest } from "next/server";
import { MFAService } from "@/lib/auth/mfa";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    if (!body.otp) {
      return validationErrorResponse([
        { field: "otp", message: "OTP is required" },
      ]);
    }

    const isValid = await MFAService.verifyUserOTP(session.user.id, body.otp);

    if (!isValid) {
      return validationErrorResponse([
        { field: "otp", message: "Invalid OTP" },
      ]);
    }

    await MFAService.disableMFA(session.user.id);

    return successResponse({ message: "MFA disabled successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/auth/mfa/enable/route.ts

```typescript
// src/app/api/auth/mfa/enable/route.ts
import { NextRequest } from "next/server";
import { MFAService } from "@/lib/auth/mfa";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

// PERBAIKAN: Ubah 'request' menjadi '_request' untuk menghindari error unused variable
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // PERBAIKAN LOGIKA:
    // MFAService.enableMFA membutuhkan (userId, email) dan mengembalikan { secret, qrCodeUrl }
    // Kode sebelumnya hanya mengirim userId dan menganggap return-nya string.
    const { secret, qrCodeUrl } = await MFAService.enableMFA(
      session.user.id,
      session.user.email,
    );

    // Gunakan qrCodeUrl dari service (atau buat manual jika service belum mengembalikan url yang diinginkan)
    const qrCodeData =
      qrCodeUrl ||
      `otpauth://totp/WhatsApp Dashboard:${session.user.email}?secret=${secret}&issuer=WhatsApp Dashboard`;

    return successResponse({
      secret,
      qrCodeData,
      message: "MFA enabled successfully. Please scan the QR code.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/auth/mfa/verify/route.ts

```typescript
// src/app/api/auth/mfa/verify/route.ts
import { NextRequest } from "next/server";
import { MFAService } from "@/lib/auth/mfa";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    if (!body.otp) {
      return validationErrorResponse([
        { field: "otp", message: "OTP is required" },
      ]);
    }

    const isValid = await MFAService.verifyUserOTP(session.user.id, body.otp);

    if (!isValid) {
      return validationErrorResponse([
        { field: "otp", message: "Invalid OTP" },
      ]);
    }

    return successResponse({ valid: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/auto-response/[ruleId]/route.ts

```typescript
import { NextRequest } from "next/server";
import { AutoResponseQueries } from "@/lib/db/queries/auto-response.queries";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { createAutoResponseSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    ruleId: string;
  }>;
};

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { ruleId } = await params;
    const body = await _request.json();

    const rule = await AutoResponseQueries.findById(ruleId);
    if (!rule) {
      return notFoundResponse("Auto-response rule");
    }

    const device = await DeviceQueries.findById(rule.device_id);
    if (!device || device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const validation = validate(createAutoResponseSchema.partial(), body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    await AutoResponseQueries.update(ruleId, validation.data);

    const updated = await AutoResponseQueries.findById(ruleId);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { ruleId } = await params;
    const rule = await AutoResponseQueries.findById(ruleId);

    if (!rule) {
      return notFoundResponse("Auto-response rule");
    }

    const device = await DeviceQueries.findById(rule.device_id);
    if (!device || device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await AutoResponseQueries.delete(ruleId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/auto-response/route.ts

```typescript
import { NextRequest } from "next/server";
import { AutoResponseQueries } from "@/lib/db/queries/auto-response.queries";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { createAutoResponseSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      return validationErrorResponse([
        { field: "deviceId", message: "Device ID is required" },
      ]);
    }

    const device = await DeviceQueries.findById(deviceId);
    if (!device) {
      return notFoundResponse("Device");
    }

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const rules = await AutoResponseQueries.findByDeviceId(deviceId);
    return successResponse(rules);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    const validation = validate(createAutoResponseSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const device = await DeviceQueries.findById(validation.data.deviceId);
    if (!device) {
      return notFoundResponse("Device");
    }

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const rule = await AutoResponseQueries.create({
      keyword: validation.data.keyword,
      response: validation.data.response,
      device_id: validation.data.deviceId,
      priority: validation.data.priority,
      is_active: validation.data.isActive,
    });

    return successResponse(rule, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/backup/restore/route.ts

```typescript
// src/app/api/backup/restore/route.ts
import { NextRequest } from "next/server";
import { BackupService } from "@/lib/services/backup.service";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Only admins can restore backups");
    }

    const body = await _request.json();

    if (!body.filepath) {
      return validationErrorResponse([
        { field: "filepath", message: "Backup filepath is required" },
      ]);
    }

    await BackupService.restoreBackup(body.filepath);

    return successResponse({
      message: "Backup restored successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/backup/route.ts

```typescript
// src/app/api/backup/route.ts
import { NextRequest } from "next/server";
import { BackupService } from "@/lib/services/backup.service";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

// PERBAIKAN: Ubah 'request' menjadi '_request'
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Only admins can create backups");
    }

    const filepath = await BackupService.createBackup();

    return successResponse({
      message: "Backup created successfully",
      filepath,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PERBAIKAN: Ubah 'request' menjadi '_request' juga di sini karena tidak dipakai
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    if (session.user.role !== UserRole.ADMIN) {
      return forbiddenResponse("Only admins can list backups");
    }

    const backups = await BackupService.listBackups();

    return successResponse(backups);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/chatbot/message/route.ts

```typescript
import { NextRequest } from "next/server";
import { MessageService } from "@/lib/services/message.service";
import { ApiKeyQueries } from "@/lib/db/queries/api-key.queries";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function POST(_request: NextRequest) {
  try {
    const apiKey = _request.headers.get("x-api-key");

    if (!apiKey) {
      return unauthorizedResponse("API key is required");
    }

    const keyHash = ApiKeyQueries.hashApiKey(apiKey);
    const apiKeyRecord = await ApiKeyQueries.findByHash(keyHash);

    if (!apiKeyRecord || !apiKeyRecord.is_active) {
      return unauthorizedResponse("Invalid or inactive API key");
    }

    await ApiKeyQueries.updateLastUsed(apiKeyRecord.id);

    const body = await _request.json();

    if (!body.deviceId || !body.toNumber || !body.message) {
      return validationErrorResponse([
        { field: "deviceId", message: "Device ID is required" },
        { field: "toNumber", message: "Phone number is required" },
        { field: "message", message: "Message is required" },
      ]);
    }

    const rateLimitCheck = await RateLimiter.checkLimit(body.deviceId);
    if (!rateLimitCheck.allowed) {
      return validationErrorResponse([
        {
          field: "rateLimit",
          message: rateLimitCheck.reason || "Rate limit exceeded",
        },
      ]);
    }

    const message = await MessageService.sendMessage({
      device_id: body.deviceId,
      user_id: apiKeyRecord.user_id,
      to_number: body.toNumber,
      message: body.message,
    });

    return successResponse({
      messageId: message.id,
      status: message.status,
      queuedAt: message.created_at,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/contacts/[contactId]/route.ts

```typescript
import { NextRequest } from "next/server";
import { ContactService } from "@/lib/services/contact.service";
import { updateContactSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    contactId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { contactId } = await params;
    const contact = await ContactService.getContact(contactId);

    if (!contact) {
      return notFoundResponse("Contact");
    }

    if (contact.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    return successResponse(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { contactId } = await params;
    const body = await _request.json();

    const contact = await ContactService.getContact(contactId);
    if (!contact) {
      return notFoundResponse("Contact");
    }

    if (contact.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const validation = validate(updateContactSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    await ContactService.updateContact(contactId, {
      name: validation.data.name,
      phone_number: validation.data.phoneNumber,
      email: validation.data.email,
      tags: validation.data.tags,
    });

    const updated = await ContactService.getContact(contactId);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { contactId } = await params;
    const contact = await ContactService.getContact(contactId);

    if (!contact) {
      return notFoundResponse("Contact");
    }

    if (contact.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await ContactService.deleteContact(contactId);

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/contacts/export/route.ts

```typescript
import { ContactService } from "@/lib/services/contact.service";
import { handleApiError, unauthorizedResponse } from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const csv = await ContactService.exportToCSV(session.user.id);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="contacts.csv"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/contacts/import/route.ts

```typescript
import { NextRequest } from "next/server";
import { ContactService } from "@/lib/services/contact.service";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const formData = await _request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return validationErrorResponse([
        { field: "file", message: "File is required" },
      ]);
    }

    const content = await file.text();
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    let result;

    if (fileExtension === "csv") {
      result = await ContactService.importFromCSV(content, session.user.id);
    } else if (fileExtension === "vcf") {
      result = await ContactService.importFromVCF(content, session.user.id);
    } else {
      return validationErrorResponse([
        { field: "file", message: "Only CSV and VCF files are supported" },
      ]);
    }

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/contacts/route.ts

```typescript
import { NextRequest } from "next/server";
import { ContactService } from "@/lib/services/contact.service";
import { createContactSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const contacts = await ContactService.getUserContacts(session.user.id, {
      search,
      limit,
      offset,
    });

    const total = await ContactService.countUserContacts(session.user.id);

    return paginatedResponse(contacts, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    const validation = validate(createContactSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const contact = await ContactService.createContact({
      name: validation.data.name,
      phone_number: validation.data.phoneNumber,
      email: validation.data.email || null,
      tags: validation.data.tags || [],
      user_id: session.user.id,
    });

    return successResponse(contact, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const ids = searchParams.get("ids")?.split(",") || [];

    if (ids.length === 0) {
      return validationErrorResponse([
        { field: "ids", message: "Contact IDs are required" },
      ]);
    }

    const deleted = await ContactService.deleteMultipleContacts(ids);

    return successResponse({ deleted });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/cron/cleanup/route.ts

```typescript
import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import * as fs from "fs";
import * as path from "path";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return unauthorizedResponse();
    }

    const days = 30;
    const result: any = await query(
      `DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    let deletedFiles = 0;

    const scanAndDelete = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          scanAndDelete(filePath);
          if (fs.readdirSync(filePath).length === 0) {
            fs.rmdirSync(filePath);
          }
        } else {
          if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            deletedFiles++;
          }
        }
      }
    };

    scanAndDelete(uploadsDir);

    await query("OPTIMIZE TABLE messages, message_queue, audit_logs");

    return successResponse({
      message: "Cleanup completed",
      deletedMessages: result.affectedRows,
      deletedFiles,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/devices/[deviceId]/qr/route.ts

```typescript
import { NextRequest } from "next/server";
import { DeviceService } from "@/lib/services/device.service";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";
import QRCode from "qrcode";

type Params = { params: Promise<{ deviceId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { deviceId } = await params;
    const device = await DeviceQueries.findById(deviceId);

    if (!device) return notFoundResponse("Device");
    if (device.user_id !== session.user.id) return forbiddenResponse();

    const { qrCode, status } = await DeviceService.getQRCode(deviceId);

    const { searchParams } = new URL(req.url);
    if (searchParams.get("format") === "image" && qrCode) {
      const qrImage = await QRCode.toDataURL(qrCode);
      return successResponse({ qrCode: qrImage, status, type: "image" });
    }

    return successResponse({ qrCode, status, type: "text" });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/devices/[deviceId]/reconnect/route.ts

```typescript
// src/app/api/devices/[deviceId]/reconnect/route.ts
import { NextRequest } from "next/server";
import { DeviceService } from "@/lib/services/device.service";
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    deviceId: string;
  }>;
};

// PERBAIKAN: Ubah 'request' menjadi '_request'
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { deviceId } = await params;

    const device = await DeviceService.getDevice(deviceId);
    if (!device) return notFoundResponse("Device");

    if (device.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await DeviceService.reconnectDevice(deviceId);

    return successResponse({ message: "Reconnection initiated" });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/devices/[deviceId]/route.ts

```typescript
import { NextRequest } from "next/server";
import { DeviceService } from "@/lib/services/device.service";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";

type Params = { params: Promise<{ deviceId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { deviceId } = await params;
    const device = await DeviceQueries.findById(deviceId);

    if (!device) return notFoundResponse("Device");
    if (device.user_id !== session.user.id) return forbiddenResponse();

    const { qrCode, status } = await DeviceService.getQRCode(deviceId);

    return successResponse({
      ...device,
      realtimeStatus: status,
      hasQr: !!qrCode,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { deviceId } = await params;
    const device = await DeviceQueries.findById(deviceId);

    if (!device) return notFoundResponse("Device");
    if (device.user_id !== session.user.id) return forbiddenResponse();

    await DeviceService.deleteDevice(deviceId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/devices/route.ts

```typescript
import { NextRequest } from "next/server";
import { DeviceService } from "@/lib/services/device.service";
import { createDeviceSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const devices = await DeviceService.getUserDevices(session.user.id);

    return successResponse(devices);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    const validation = validate(createDeviceSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const device = await DeviceService.createDevice({
      name: validation.data.name,
      phone_number: validation.data.phoneNumber,
      user_id: session.user.id,
    });

    return successResponse(device, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/docs/route.ts

```typescript
import { NextResponse } from "next/server";
import swaggerSpec from "@/lib/docs/openapi.json";

export async function GET() {
  return NextResponse.json(swaggerSpec);
}
```

### Path: src/app/api/health/route.ts

```typescript
import { NextRequest } from "next/server";
import { healthCheck } from "@/lib/db";
import { whatsappClientManager } from "@/lib/whatsapp/client-manager";
import { messageQueue } from "@/lib/whatsapp/message-queue";
import { successResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(_request: NextRequest) {
  try {
    const dbHealthy = await healthCheck();
    const queueStatus = messageQueue.getStatus();
    const activeClients = whatsappClientManager.getActiveClients();

    const health = {
      status: dbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealthy ? "up" : "down",
        },
        messageQueue: {
          status: "up",
          queueSize: queueStatus.queueSize,
          processing: queueStatus.processing,
          pendingMessages: queueStatus.pendingMessages,
        },
        whatsappClients: {
          status: "up",
          activeClients: activeClients.length,
          clients: activeClients,
        },
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };

    return successResponse(health);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/inbox/conversations/route.ts

```typescript
// src/app/api/inbox/conversations/route.ts
import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  unauthorizedResponse,
  successResponse,
  handleApiError,
} from "@/lib/utils/api-response";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const sql = `
      SELECT 
        t1.remote_number,
        t1.display_name,
        m.message as last_message,
        m.created_at as last_activity,
        m.status
      FROM (
        SELECT 
          CASE 
            WHEN messages.direction = 'INBOUND' THEN messages.from_number 
            ELSE messages.to_number 
          END as remote_number,
          MAX(messages.id) as last_message_id,
          MAX(CASE WHEN messages.direction = 'INBOUND' THEN messages.from_number ELSE messages.to_number END) as display_name
        FROM messages 
        JOIN devices d ON messages.device_id = d.id
        WHERE d.user_id = ?
        GROUP BY remote_number
      ) t1
      JOIN messages m ON t1.last_message_id = m.id
      ORDER BY m.created_at DESC
    `;

    const rows: any[] = await query(sql, [session.user.id]);

    const conversations = rows.map((row) => ({
      id: row.remote_number,
      name: row.display_name || row.remote_number,
      number: row.remote_number,
      lastMessage: row.last_message,
      time: new Date(row.last_activity).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isGroup: row.remote_number.endsWith("@g.us"),
      unreadCount: 0,
    }));

    return successResponse(conversations);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/inbox/messages/route.ts

```typescript
import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  unauthorizedResponse,
  successResponse,
  handleApiError,
} from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId"); // Remote Number (from/to)

    if (!chatId) return successResponse([]);

    const sql = `
      SELECT m.* 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ? 
      AND (m.from_number = ? OR m.to_number = ?)
      ORDER BY m.created_at ASC
      LIMIT 100
    `;

    const rows: any[] = await query(sql, [session.user.id, chatId, chatId]);

    const messages = rows.map((row) => ({
      id: row.id,
      text: row.message,
      isMe: row.direction === "OUTBOUND",
      time: new Date(row.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: row.status,
    }));

    return successResponse(messages);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/messages/[messageId]/route.ts

```typescript
import { NextRequest } from "next/server";
import {
  handleApiError,
  unauthorizedResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query, queryOne } from "@/lib/db";
import { Message } from "@/types/database.types";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const deviceId = searchParams.get("deviceId");
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    let sql = `
      SELECT m.*, d.name as device_name 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const params: any[] = [session.user.id];

    if (deviceId) {
      sql += " AND m.device_id = ?";
      params.push(deviceId);
    }

    if (status) {
      sql += " AND m.status = ?";
      params.push(status);
    }

    sql += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const messages = await query<Message[]>(sql, params);

    let countSql = `
      SELECT COUNT(*) as total 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const countParams: any[] = [session.user.id];

    if (deviceId) {
      countSql += " AND m.device_id = ?";
      countParams.push(deviceId);
    }

    if (status) {
      countSql += " AND m.status = ?";
      countParams.push(status);
    }

    const countResult = await queryOne<{ total: number }>(
      countSql,
      countParams,
    );

    return paginatedResponse(messages, page, limit, countResult?.total || 0);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/messages/route.ts

```typescript
import { NextRequest } from "next/server";
import { MessageQueries } from "@/lib/db/queries/message.queries";
import {
  handleApiError,
  unauthorizedResponse,
  paginatedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const deviceId = searchParams.get("deviceId") || undefined;
    const search = searchParams.get("search") || undefined;
    const offset = (page - 1) * limit;

    const messages = await MessageQueries.findByUserId(session.user.id, {
      limit,
      offset,
      deviceId,
      search,
    });

    const total = await MessageQueries.countByUserId(session.user.id, {
      deviceId,
      search,
    });

    return paginatedResponse(messages, page, limit, total);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/messages/send/route.ts

```typescript
import { NextRequest } from "next/server";
import { MessageService } from "@/lib/services/message.service";
import { StorageService } from "@/lib/services/storage.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { DeviceQueries } from "@/lib/db/queries/device.queries";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        deviceId: formData.get("deviceId") as string,
        toNumber: formData.get("toNumber") as string,
        message: formData.get("message") as string,
        media: formData.get("media") as File | null,
        useRoundRobin: formData.get("useRoundRobin") === "true",
        contacts: formData.get("contacts")
          ? JSON.parse(formData.get("contacts") as string)
          : undefined,
      };
    } else {
      body = await req.json();
    }

    if (!body.contacts && body.deviceId) {
      const rateLimitCheck = await RateLimiter.checkLimit(body.deviceId);
      if (!rateLimitCheck.allowed) {
        return validationErrorResponse([
          {
            field: "rateLimit",
            message: rateLimitCheck.reason || "Rate limit exceeded",
          },
        ]);
      }
    }

    if (body.contacts && Array.isArray(body.contacts)) {
      const result = await MessageService.sendBulkMessages({
        userId: session.user.id,
        contacts: body.contacts,
        message: body.message,
        deviceIds: body.deviceId ? [body.deviceId] : undefined,
        useRoundRobin: body.useRoundRobin || false,
      });
      return successResponse(result, { status: 201 });
    }

    if (!body.deviceId && !body.useRoundRobin) {
      const devices = await DeviceQueries.getActiveDevices();
      const userDevices = devices.filter((d) => d.user_id === session.user.id);
      if (userDevices.length > 0) {
        body.deviceId = userDevices[0].id;
      } else {
        return validationErrorResponse([
          { field: "deviceId", message: "No active device found" },
        ]);
      }
    }

    let mediaPath = undefined;
    let mediaType: "image" | "video" | "audio" | "document" | undefined =
      undefined;

    if (body.media && body.media.size > 0) {
      if (body.media.type.startsWith("image/")) mediaType = "image";
      else if (body.media.type.startsWith("video/")) mediaType = "video";
      else if (body.media.type.startsWith("audio/")) mediaType = "audio";
      else mediaType = "document";

      const saved = await StorageService.saveFile(body.media, "messages");
      mediaPath = saved.path;
    }

    const result = await MessageService.sendMessage({
      user_id: session.user.id,
      device_id: body.deviceId,
      to_number: body.toNumber?.replace(/\D/g, "") || "",
      message: body.message || "",
      media_path: mediaPath,
      media_type: mediaType,
    });

    return successResponse(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/reports/export/route.ts

```typescript
// src/app/api/reports/export/route.ts
import { NextRequest } from "next/server";
import { PdfExportService } from "@/lib/services/pdf-export.service";
import { MessageQueries } from "@/lib/db/queries/message.queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { unauthorizedResponse, handleApiError } from "@/lib/utils/api-response";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId") || undefined;

    // Get messages (limit to last 500 for report to avoid timeouts)
    const messages = await MessageQueries.findByDeviceId(deviceId || "", {
      limit: 500,
    });

    const buffer = await PdfExportService.generateMessageReport(messages);

    // PERBAIKAN: Cast buffer ke 'any' atau 'BodyInit' untuk menghindari error tipe TypeScript
    return new Response(buffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="report.pdf"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/settings/route.ts

```typescript
import { NextRequest } from "next/server";
import { SettingsService } from "@/lib/services/settings.service";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { searchParams } = new URL(_request.url);
    const scope = searchParams.get("scope") || "user";

    if (scope === "system") {
      if (session.user.role !== UserRole.ADMIN) {
        return forbiddenResponse("Admin access required");
      }
      const settings = await SettingsService.getSystemSettings();
      return successResponse(settings);
    }

    const settings = await SettingsService.getUserSettings(session.user.id);
    return successResponse(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const body = await _request.json();
    const { scope, settings } = body;

    if (!settings) {
      return validationErrorResponse([
        { field: "settings", message: "Settings object required" },
      ]);
    }

    if (scope === "system") {
      if (session.user.role !== UserRole.ADMIN) {
        return forbiddenResponse();
      }
      await SettingsService.updateSystemSettings(settings);
    } else {
      await SettingsService.updateUserSettings(session.user.id, settings);
    }

    return successResponse({ message: "Settings updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/stats/route.ts

```typescript
// src/app/api/stats/route.ts
import { NextRequest } from "next/server";
import { MessageService } from "@/lib/services/message.service";
import { DeviceService } from "@/lib/services/device.service";
import {
  successResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    // Fix: method getMessageStats sudah ditambahkan di Service
    const messageStats = await MessageService.getMessageStats({
      deviceId,
      startDate,
      endDate,
    });

    const hourlyStats = await MessageService.getHourlyStats(deviceId, 24);

    // Fix: method getUserDevices sudah ditambahkan di Service
    const devices = await DeviceService.getUserDevices(session.user.id);
    const deviceStats = devices.map((device) => ({
      deviceId: device.id,
      deviceName: device.name,
      status: device.status,
      isReady: device.is_ready,
      messageCount: device.message_count || 0,
      lastMessageAt: device.last_message_at,
    }));

    const totalDevices = devices.length;
    const activeDevices = devices.filter(
      (d) => d.status === "AUTHENTICATED" && d.is_ready,
    ).length;

    return successResponse({
      overview: {
        totalDevices,
        activeDevices,
        totalMessages: messageStats.total,
        sentMessages: messageStats.sent,
        failedMessages: messageStats.failed,
        pendingMessages: messageStats.pending,
        successRate: messageStats.successRate,
      },
      devices: deviceStats,
      hourlyStats,
      period: {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function HEAD(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const devices = await DeviceService.getUserDevices(session.user.id);
    const todayStats = await MessageService.getMessageStats({});

    return successResponse({
      totalDevices: devices.length,
      activeDevices: devices.filter((d) => d.is_ready).length,
      todayMessages: todayStats.total,
      successRate: todayStats.successRate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/status/route.ts

```typescript
import { NextRequest } from "next/server";
import { whatsappClientManager } from "@/lib/whatsapp/client-manager";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { StorageService } from "@/lib/services/storage.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const formData = await req.formData();
    const text = formData.get("text") as string;
    const file = formData.get("file") as File | null;
    const deviceId = formData.get("deviceId") as string;

    if (!deviceId) {
      return validationErrorResponse([
        { field: "deviceId", message: "Device ID required" },
      ]);
    }

    const device = await DeviceQueries.findById(deviceId);
    if (!device || device.user_id !== session.user.id) {
      return validationErrorResponse([
        { field: "deviceId", message: "Invalid device" },
      ]);
    }

    let mediaPath = undefined;
    if (file) {
      const saved = await StorageService.saveFile(file, "status");
      mediaPath = saved.path;
    }

    await whatsappClientManager.postStatus(deviceId, text, mediaPath);

    return successResponse({ posted: true, timestamp: new Date() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  return successResponse([]);
}
```

### Path: src/app/api/templates/[templateId]/route.ts

```typescript
import { NextRequest } from "next/server";
import { TemplateQueries } from "@/lib/db/queries/template.queries";
import { createTemplateSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    templateId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { templateId } = await params;
    const template = await TemplateQueries.findById(templateId);

    if (!template) {
      return notFoundResponse("Template");
    }

    if (template.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    return successResponse(template);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { templateId } = await params;
    const body = await _request.json();

    const template = await TemplateQueries.findById(templateId);
    if (!template) {
      return notFoundResponse("Template");
    }

    if (template.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    const validation = validate(createTemplateSchema.partial(), body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    await TemplateQueries.update(templateId, validation.data);

    const updated = await TemplateQueries.findById(templateId);
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { templateId } = await params;
    const template = await TemplateQueries.findById(templateId);

    if (!template) {
      return notFoundResponse("Template");
    }

    if (template.user_id !== session.user.id) {
      return forbiddenResponse();
    }

    await TemplateQueries.delete(templateId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/templates/route.ts

```typescript
// src/app/api/templates/route.ts
import { NextRequest } from "next/server";
import { TemplateQueries } from "@/lib/db/queries/template.queries";
import { createTemplateSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const templates = await TemplateQueries.findByUserId(session.user.id);
    return successResponse(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    const validation = validate(createTemplateSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const template = await TemplateQueries.create({
      ...validation.data,
      user_id: session.user.id,
    });

    return successResponse(template, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/tools/validate-number/route.ts

```typescript
import { NextRequest } from "next/server";
import { whatsappClientManager } from "@/lib/whatsapp/client-manager";
import { DeviceQueries } from "@/lib/db/queries/device.queries";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const body = await _request.json();
    const { deviceId, phoneNumber } = body;

    if (!deviceId || !phoneNumber) {
      return validationErrorResponse([
        { field: "fields", message: "DeviceId and PhoneNumber are required" },
      ]);
    }

    // Pastikan device milik user
    const device = await DeviceQueries.findById(deviceId);
    if (!device || device.user_id !== session.user.id) {
      return validationErrorResponse([
        { field: "deviceId", message: "Invalid Device ID" },
      ]);
    }

    // Cek status koneksi
    if (device.status !== "AUTHENTICATED") {
      return validationErrorResponse([
        { field: "device", message: "Device is not connected" },
      ]);
    }

    // Gunakan client manager untuk cek nomor
    // Catatan: Kita perlu mengekspos metode check number di ClientManager
    // Karena method sendMessage sudah melakukan pengecekan, kita bisa buat method baru di client-manager.ts
    // Tapi untuk sekarang kita asumsikan akses langsung ke instance client (perlu modifikasi dikit di client-manager)

    // WORKAROUND: Akses manual via client manager (perlu penyesuaian akses public/private di ClientManager jika strict)
    // Anggap kita tambahkan method isRegistered(deviceId, number) di whatsappClientManager

    // Mari kita tambahkan logic di sini seolah method itu ada,
    // *PENTING*: Anda harus menambahkan method `isRegistered` di `src/lib/whatsapp/client-manager.ts`

    // @ts-ignore - Asumsi method ini ditambahkan
    const result = await whatsappClientManager.checkNumber(
      deviceId,
      phoneNumber,
    );

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/users/[userId]/route.ts

```typescript
import { NextRequest } from "next/server";
import { queryOne, query } from "@/lib/db";
import {
  successResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";
import { User } from "@/types/database.types";

type Params = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { userId } = await params;

    if (session.user.role !== UserRole.ADMIN && session.user.id !== userId) {
      return forbiddenResponse();
    }

    const user = await queryOne<User>(
      "SELECT id, email, name, role, is_active, created_at FROM users WHERE id = ?",
      [userId],
    );

    if (!user) return notFoundResponse("User");

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { userId } = await params;
    const body = await _request.json();

    // Only admin can update other users or change roles
    if (session.user.role !== UserRole.ADMIN && session.user.id !== userId) {
      return forbiddenResponse();
    }

    if (session.user.role !== UserRole.ADMIN && body.role) {
      return forbiddenResponse("Only admins can change roles");
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (body.name) {
      updates.push("name = ?");
      values.push(body.name);
    }

    if (body.role && session.user.role === UserRole.ADMIN) {
      updates.push("role = ?");
      values.push(body.role);
    }

    if (updates.length === 0) {
      return validationErrorResponse([
        { field: "body", message: "No fields to update" },
      ]);
    }

    updates.push("updated_at = NOW()");
    values.push(userId);

    await query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    return successResponse({ message: "User updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/webhooks/[webhookId]/route.ts

```typescript
import { NextRequest } from "next/server";
import { WebhookService } from "@/lib/services/webhook.service";
import { updateWebhookSchema, validate } from "@/lib/validations/schemas";
import {
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type Params = {
  params: Promise<{
    webhookId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { webhookId } = await params;
    const webhook = await WebhookService.getWebhook(webhookId);

    if (!webhook) return notFoundResponse("Webhook");
    if (webhook.user_id !== session.user.id) return forbiddenResponse();

    return successResponse(webhook);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { webhookId } = await params;
    const body = await _request.json();

    const webhook = await WebhookService.getWebhook(webhookId);
    if (!webhook) return notFoundResponse("Webhook");
    if (webhook.user_id !== session.user.id) return forbiddenResponse();

    const validation = validate(updateWebhookSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    await WebhookService.updateWebhook(webhookId, validation.data);
    const updated = await WebhookService.getWebhook(webhookId);

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorizedResponse();

    const { webhookId } = await params;
    const webhook = await WebhookService.getWebhook(webhookId);

    if (!webhook) return notFoundResponse("Webhook");
    if (webhook.user_id !== session.user.id) return forbiddenResponse();

    await WebhookService.deleteWebhook(webhookId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/app/api/webhooks/route.ts

```typescript
import { NextRequest } from "next/server";
import { WebhookService } from "@/lib/services/webhook.service";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await _request.json();

    if (!body.url || !body.events) {
      return validationErrorResponse([
        { field: "url", message: "Webhook URL is required" },
        { field: "events", message: "Events array is required" },
      ]);
    }

    try {
      new URL(body.url);
    } catch {
      return validationErrorResponse([
        { field: "url", message: "Invalid URL format" },
      ]);
    }

    const webhook = await WebhookService.createWebhook({
      url: body.url,
      events: body.events,
      user_id: session.user.id,
      secret: body.secret,
      is_active: body.is_active !== undefined ? body.is_active : true,
    });

    return successResponse(webhook, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const webhooks = await WebhookService.getUserWebhooks(session.user.id);
    return successResponse(webhooks);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path: src/lib/auth/mfa.ts

```typescript
import speakeasy from "speakeasy";
import { query, queryOne } from "@/lib/db";

export class MFAService {
  static generateSecret(email: string): {
    secret: string;
    otpauth_url: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `WhatsApp Dashboard (${email})`,
      issuer: "WhatsApp Dashboard",
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url || "",
    };
  }

  static verifyOTP(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2,
    });
  }

  static async enableMFA(
    userId: string,
    email: string,
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    const { secret, otpauth_url } = this.generateSecret(email);

    await query(
      "UPDATE users SET mfa_enabled = true, mfa_secret = ? WHERE id = ?",
      [secret, userId],
    );

    return {
      secret,
      qrCodeUrl: otpauth_url,
    };
  }

  static async disableMFA(userId: string): Promise<void> {
    await query(
      "UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = ?",
      [userId],
    );
  }

  static async verifyUserOTP(userId: string, token: string): Promise<boolean> {
    const user: any = await queryOne(
      "SELECT mfa_secret FROM users WHERE id = ? AND mfa_enabled = true",
      [userId],
    );

    if (!user?.mfa_secret) {
      return false;
    }

    return this.verifyOTP(user.mfa_secret, token);
  }
}
```

### Path: src/lib/auth/middleware.ts

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { UserRole } from "@/types/database.types";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role as UserRole)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function getSession() {
  return getServerSession(authOptions);
}
```

### Path: src/lib/auth/options.ts

```typescript
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { queryOne, query } from "@/lib/db";
import { UserRole } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        const existing: any = await queryOne(
          "SELECT * FROM users WHERE email = ?",
          [user.email],
        );

        if (!existing) {
          await query(
            "INSERT INTO users (id, email, name, role, is_active) VALUES (?, ?, ?, ?, true)",
            [uuidv4(), user.email, user.name || "User", UserRole.USER_A],
          );
        } else if (!existing.is_active) {
          return false;
        }
        return true;
      } catch (e) {
        console.error("SignIn Error:", e);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser: any = await queryOne(
          "SELECT id, role FROM users WHERE email = ?",
          [user.email],
        );
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### Path: src/lib/auth/rbac.ts

```typescript
import { UserRole } from "@/types/database.types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.DST]: 80,
  [UserRole.USER_A]: 60,
  [UserRole.USER_B]: 40,
  [UserRole.USER_C]: 20,
};

export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_ALL_DEVICES: "manage_all_devices",
  MANAGE_OWN_DEVICES: "manage_own_devices",
  SEND_MESSAGES: "send_messages",
  VIEW_STATS: "view_stats",
  VIEW_ALL_STATS: "view_all_stats",
  MANAGE_API_KEYS: "manage_api_keys",
  MANAGE_WEBHOOKS: "manage_webhooks",
  BACKUP_RESTORE: "backup_restore",
  VIEW_AUDIT_LOGS: "view_audit_logs",
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ALL_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_ALL_STATS,
    PERMISSIONS.MANAGE_API_KEYS,
    PERMISSIONS.MANAGE_WEBHOOKS,
    PERMISSIONS.BACKUP_RESTORE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  [UserRole.DST]: [
    PERMISSIONS.MANAGE_ALL_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_ALL_STATS,
    PERMISSIONS.MANAGE_API_KEYS,
    PERMISSIONS.MANAGE_WEBHOOKS,
  ],
  [UserRole.USER_A]: [
    PERMISSIONS.MANAGE_OWN_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_STATS,
    PERMISSIONS.MANAGE_API_KEYS,
  ],
  [UserRole.USER_B]: [
    PERMISSIONS.MANAGE_OWN_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_STATS,
  ],
  [UserRole.USER_C]: [
    PERMISSIONS.MANAGE_OWN_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessResource(
  userRole: UserRole,
  ownerId: string,
  userId: string,
): boolean {
  if (userRole === UserRole.ADMIN || userRole === UserRole.DST) {
    return true;
  }
  return ownerId === userId;
}
```

### Path: src/lib/db/index.ts

```typescript
import mysql from "mysql2/promise";
import { appConfig } from "@/config/app.config";

class Database {
  private static instance: Database;
  private pool: mysql.Pool | null = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): mysql.Pool {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: appConfig.database.host,
        port: appConfig.database.port,
        user: appConfig.database.user,
        password: appConfig.database.password,
        database: appConfig.database.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        timezone: "+00:00",
        multipleStatements: false,
        namedPlaceholders: true,
      });

      (this.pool as any).on("error", (err: any) => {
        console.error("Database pool error:", err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
          this.reconnect();
        }
      });
    }

    return this.pool;
  }

  private reconnect(): void {
    if (this.pool) {
      this.pool.end().catch(console.error);
      this.pool = null;
    }
    this.getPool();
  }

  public async query<T = any>(sql: string, params?: any[]): Promise<T> {
    try {
      const pool = this.getPool();
      const [rows] = await pool.execute(sql, params);
      return rows as T;
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  }

  public async queryOne<T = any>(
    sql: string,
    params?: any[],
  ): Promise<T | null> {
    const rows = await this.query<T[]>(sql, params);
    return Array.isArray(rows) && rows.length > 0 ? (rows[0] as T) : null;
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
}

const db = Database.getInstance();

export const query = <T = any>(sql: string, params?: any[]): Promise<T> =>
  db.query<T>(sql, params);
export const queryOne = <T = any>(
  sql: string,
  params?: any[],
): Promise<T | null> => db.queryOne<T>(sql, params);
export const closeDatabase = (): Promise<void> => db.close();
export const healthCheck = (): Promise<boolean> => db.healthCheck();

export default db;
```

### Path: src/lib/db/migrations/index.ts

```typescript
// src/lib/db/migrations/index.ts

import * as fs from "fs";
import * as path from "path";
import { query, queryOne } from "../index";

interface Migration {
  id: number;
  name: string;
  executed_at: Date;
}

export class MigrationRunner {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = path.join(process.cwd(), "database", "migrations");
    this.ensureMigrationsTable();
  }

  private async ensureMigrationsTable(): Promise<void> {
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async getExecutedMigrations(): Promise<Migration[]> {
    return query<Migration[]>("SELECT * FROM migrations ORDER BY id ASC");
  }

  async getMigrationFiles(): Promise<string[]> {
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      return [];
    }

    const files = fs
      .readdirSync(this.migrationsPath)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    return files;
  }

  async run(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    const executedNames = new Set(executedMigrations.map((m) => m.name));

    const migrationFiles = await this.getMigrationFiles();
    const pendingMigrations = migrationFiles.filter(
      (f) => !executedNames.has(f),
    );

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations");
      return;
    }

    console.log(`Running ${pendingMigrations.length} migrations...`);

    for (const migrationFile of pendingMigrations) {
      const filePath = path.join(this.migrationsPath, migrationFile);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`Executing migration: ${migrationFile}`);

      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await query(statement);
      }

      await query("INSERT INTO migrations (name) VALUES (?)", [migrationFile]);

      console.log(`Completed migration: ${migrationFile}`);
    }

    console.log("All migrations completed successfully");
  }

  async rollback(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();

    if (executedMigrations.length === 0) {
      console.log("No migrations to rollback");
      return;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    console.log(`Rolling back migration: ${lastMigration.name}`);

    await query("DELETE FROM migrations WHERE id = ?", [lastMigration.id]);

    console.log(`Rollback completed: ${lastMigration.name}`);
  }

  async create(name: string): Promise<void> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const filename = `${timestamp}_${name}.sql`;
    const filepath = path.join(this.migrationsPath, filename);

    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your SQL statements here

`;

    fs.writeFileSync(filepath, template);
    console.log(`Created migration file: ${filename}`);
  }
}

export const migrationRunner = new MigrationRunner();
```

### Path: src/lib/db/queries/api-key.queries.ts

```typescript
import { query, queryOne } from "../index";
import { ApiKey } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

export class ApiKeyQueries {
  static async findById(id: string): Promise<ApiKey | null> {
    return queryOne<ApiKey>("SELECT * FROM api_keys WHERE id = ?", [id]);
  }

  static async findByHash(keyHash: string): Promise<ApiKey | null> {
    return queryOne<ApiKey>("SELECT * FROM api_keys WHERE key_hash = ?", [
      keyHash,
    ]);
  }

  static async findByUserId(userId: string): Promise<ApiKey[]> {
    return query<ApiKey[]>(
      "SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
  }

  static async create(data: {
    name: string;
    user_id: string;
  }): Promise<{ apiKey: ApiKey; plainKey: string }> {
    const id = uuidv4();
    const plainKey = this.generateApiKey();
    const keyHash = this.hashApiKey(plainKey);

    await query(
      `INSERT INTO api_keys (id, key_hash, name, user_id, is_active)
       VALUES (?, ?, ?, ?, true)`,
      [id, keyHash, data.name, data.user_id],
    );

    const apiKey = await this.findById(id);
    if (!apiKey) {
      throw new Error("Failed to create API key");
    }

    return { apiKey, plainKey };
  }

  static async updateLastUsed(id: string): Promise<void> {
    await query("UPDATE api_keys SET last_used = NOW() WHERE id = ?", [id]);
  }

  static async toggleActive(id: string, isActive: boolean): Promise<void> {
    await query(
      "UPDATE api_keys SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [isActive, id],
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM api_keys WHERE id = ?", [id]);
  }

  static generateApiKey(): string {
    return `wwa_${crypto.randomBytes(32).toString("hex")}`;
  }

  static hashApiKey(apiKey: string): string {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
  }
}
```

### Path: src/lib/db/queries/audit-log.queries.ts

```typescript
import { query, queryOne } from "../index";
import { AuditLog } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class AuditLogQueries {
  static async create(data: {
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    old_value?: Record<string, any>;
    new_value?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    const id = uuidv4();

    await query(
      `INSERT INTO audit_logs 
       (id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.user_id || null,
        data.action,
        data.entity_type,
        data.entity_id || null,
        data.old_value ? JSON.stringify(data.old_value) : null,
        data.new_value ? JSON.stringify(data.new_value) : null,
        data.ip_address || null,
        data.user_agent || null,
      ],
    );
  }

  static async findByUserId(
    userId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<AuditLog[]> {
    let sql =
      "SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC";
    const queryParams: any[] = [userId];

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<AuditLog[]>(sql, queryParams);
  }

  static async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return query<AuditLog[]>(
      `SELECT * FROM audit_logs 
       WHERE entity_type = ? AND entity_id = ? 
       ORDER BY created_at DESC`,
      [entityType, entityId],
    );
  }

  static async deleteOld(days: number = 90): Promise<number> {
    const result: any = await query(
      `DELETE FROM audit_logs 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );

    return result.affectedRows || 0;
  }

  static async countByUser(userId: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?",
      [userId],
    );
    return result?.count || 0;
  }

  static async findAll(params?: {
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    let sql = "SELECT * FROM audit_logs ORDER BY created_at DESC";
    const queryParams: any[] = [];

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<AuditLog[]>(sql, queryParams);
  }
}
```

### Path: src/lib/db/queries/auto-response.queries.ts

```typescript
import { query, queryOne } from "../index";
import { AutoResponseRule } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class AutoResponseQueries {
  static async findById(id: string): Promise<AutoResponseRule | null> {
    return queryOne<AutoResponseRule>(
      "SELECT * FROM auto_response_rules WHERE id = ?",
      [id],
    );
  }

  static async findByDeviceId(deviceId: string): Promise<AutoResponseRule[]> {
    return query<AutoResponseRule[]>(
      "SELECT * FROM auto_response_rules WHERE device_id = ? ORDER BY priority DESC",
      [deviceId],
    );
  }

  static async findActiveByDeviceId(
    deviceId: string,
  ): Promise<AutoResponseRule[]> {
    return query<AutoResponseRule[]>(
      `SELECT * FROM auto_response_rules 
       WHERE device_id = ? AND is_active = true 
       ORDER BY priority DESC`,
      [deviceId],
    );
  }

  static async create(data: {
    keyword: string;
    response: string;
    device_id: string;
    priority?: number;
    is_active?: boolean;
  }): Promise<AutoResponseRule> {
    const id = uuidv4();

    await query(
      `INSERT INTO auto_response_rules (id, keyword, response, device_id, priority, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.keyword,
        data.response,
        data.device_id,
        data.priority || 0,
        data.is_active !== undefined ? data.is_active : true,
      ],
    );

    const rule = await this.findById(id);
    if (!rule) {
      throw new Error("Failed to create auto-response rule");
    }

    return rule;
  }

  static async update(
    id: string,
    data: Partial<{
      keyword: string;
      response: string;
      priority: number;
      is_active: boolean;
    }>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.keyword !== undefined) {
      updates.push("keyword = ?");
      params.push(data.keyword);
    }

    if (data.response !== undefined) {
      updates.push("response = ?");
      params.push(data.response);
    }

    if (data.priority !== undefined) {
      updates.push("priority = ?");
      params.push(data.priority);
    }

    if (data.is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(data.is_active);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE auto_response_rules SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM auto_response_rules WHERE id = ?", [id]);
  }
}
```

### Path: src/lib/db/queries/contact.queries.ts

```typescript
import { query, queryOne } from "../index";
import { Contact, CreateContactDTO } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class ContactQueries {
  static async findById(id: string): Promise<Contact | null> {
    return queryOne<Contact>("SELECT * FROM contacts WHERE id = ?", [id]);
  }

  static async findByPhoneNumber(
    phoneNumber: string,
    userId: string,
  ): Promise<Contact | null> {
    return queryOne<Contact>(
      "SELECT * FROM contacts WHERE phone_number = ? AND user_id = ?",
      [phoneNumber, userId],
    );
  }

  static async findByUserId(
    userId: string,
    params?: {
      search?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Contact[]> {
    let sql = "SELECT * FROM contacts WHERE user_id = ?";
    const queryParams: any[] = [userId];

    if (params?.search) {
      sql += " AND (name LIKE ? OR phone_number LIKE ? OR email LIKE ?)";
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    sql += " ORDER BY name ASC";

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<Contact[]>(sql, queryParams);
  }

  static async create(data: CreateContactDTO): Promise<Contact> {
    const id = uuidv4();

    await query(
      `INSERT INTO contacts (id, name, phone_number, email, tags, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.phone_number,
        data.email || null,
        data.tags ? JSON.stringify(data.tags) : null,
        data.user_id,
      ],
    );

    const contact = await this.findById(id);
    if (!contact) {
      throw new Error("Failed to create contact");
    }

    return contact;
  }

  static async update(
    id: string,
    data: Partial<CreateContactDTO>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.phone_number !== undefined) {
      updates.push("phone_number = ?");
      params.push(data.phone_number);
    }

    if (data.email !== undefined) {
      updates.push("email = ?");
      params.push(data.email);
    }

    if (data.tags !== undefined) {
      updates.push("tags = ?");
      params.push(data.tags ? JSON.stringify(data.tags) : null);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE contacts SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM contacts WHERE id = ?", [id]);
  }

  static async deleteMultiple(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => "?").join(",");
    const result: any = await query(
      `DELETE FROM contacts WHERE id IN (${placeholders})`,
      ids,
    );

    return result.affectedRows || 0;
  }

  static async countByUser(userId: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM contacts WHERE user_id = ?",
      [userId],
    );
    return result?.count || 0;
  }
}
```

### Path: src/lib/db/queries/device.queries.ts

```typescript
import { query, queryOne } from "../index";
import type {
  Device,
  DeviceViewModel,
  CreateDeviceDTO,
} from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class DeviceQueries {
  static async findById(id: string): Promise<Device | null> {
    return queryOne<Device>("SELECT * FROM devices WHERE id = ?", [id]);
  }

  static async findByPhoneNumber(phoneNumber: string): Promise<Device | null> {
    return queryOne<Device>("SELECT * FROM devices WHERE phone_number = ?", [
      phoneNumber,
    ]);
  }

  static async findWithStats(userId: string): Promise<DeviceViewModel[]> {
    return query<DeviceViewModel[]>(
      `SELECT d.*, 
       (SELECT COUNT(*) FROM messages m WHERE m.device_id = d.id) as message_count,
       (SELECT MAX(created_at) FROM messages m WHERE m.device_id = d.id) as last_message_at
       FROM devices d WHERE d.user_id = ? ORDER BY d.created_at DESC`,
      [userId],
    );
  }

  static async create(data: CreateDeviceDTO): Promise<Device> {
    const id = uuidv4();
    await query(
      `INSERT INTO devices (id, name, phone_number, user_id, status, is_ready)
       VALUES (?, ?, ?, ?, 'DISCONNECTED', false)`,
      [id, data.name, data.phone_number, data.user_id],
    );
    return (await this.findById(id))!;
  }

  static async updateStatus(
    id: string,
    status: string,
    isReady: boolean = false,
  ): Promise<void> {
    await query(
      "UPDATE devices SET status = ?, is_ready = ?, last_seen = NOW(), updated_at = NOW() WHERE id = ?",
      [status, isReady, id],
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM devices WHERE id = ?", [id]);
  }

  static async getActiveDevices(): Promise<Device[]> {
    return query<Device[]>(
      "SELECT * FROM devices WHERE status = 'AUTHENTICATED' AND is_ready = true",
    );
  }

  static async countByUser(userId: string): Promise<number> {
    const res = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM devices WHERE user_id = ?",
      [userId],
    );
    return res?.count || 0;
  }
}
```

### Path: src/lib/db/queries/message.queries.ts

```typescript
import { query, queryOne } from "../index";
import type { Message, CreateMessageDTO } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class MessageQueries {
  static async findById(id: string): Promise<Message | null> {
    return queryOne<Message>("SELECT * FROM messages WHERE id = ?", [id]);
  }

  static async findByUserId(
    userId: string,
    params: {
      limit: number;
      offset: number;
      deviceId?: string;
      search?: string;
    },
  ): Promise<Message[]> {
    let sql = `
      SELECT m.*, d.name as device_name 
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const queryParams: any[] = [userId];

    if (params.deviceId) {
      sql += " AND m.device_id = ?";
      queryParams.push(params.deviceId);
    }

    if (params.search) {
      sql += " AND (m.message LIKE ? OR m.to_number LIKE ?)";
      const term = `%${params.search}%`;
      queryParams.push(term, term);
    }

    sql += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(params.limit, params.offset);

    return query<Message[]>(sql, queryParams);
  }

  static async countByUserId(
    userId: string,
    params: { deviceId?: string; search?: string },
  ): Promise<number> {
    let sql = `
      SELECT COUNT(*) as total
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;
    const queryParams: any[] = [userId];

    if (params.deviceId) {
      sql += " AND m.device_id = ?";
      queryParams.push(params.deviceId);
    }

    if (params.search) {
      sql += " AND (m.message LIKE ? OR m.to_number LIKE ?)";
      const term = `%${params.search}%`;
      queryParams.push(term, term);
    }

    const res = await queryOne<{ total: number }>(sql, queryParams);
    return res?.total || 0;
  }

  static async findPending(limit: number = 100): Promise<Message[]> {
    return query<Message[]>(
      "SELECT * FROM messages WHERE status IN ('PENDING', 'QUEUED') ORDER BY created_at ASC LIMIT ?",
      [limit],
    );
  }

  static async getStatsByUserId(userId: string) {
    const sql = `
      SELECT 
        COUNT(m.id) as total,
        SUM(CASE WHEN m.status IN ('SENT', 'DELIVERED', 'READ') THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN m.status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN m.status IN ('PENDING', 'QUEUED') THEN 1 ELSE 0 END) as pending
      FROM messages m
      JOIN devices d ON m.device_id = d.id
      WHERE d.user_id = ?
    `;

    const res = await queryOne<any>(sql, [userId]);

    return {
      total: Number(res?.total || 0),
      sent: Number(res?.sent || 0),
      failed: Number(res?.failed || 0),
      pending: Number(res?.pending || 0),
    };
  }

  static async getDetailedStats(params: {
    deviceId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    let sql = `
      SELECT 
        COUNT(id) as total,
        SUM(CASE WHEN status IN ('SENT', 'DELIVERED', 'READ') THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status IN ('PENDING', 'QUEUED') THEN 1 ELSE 0 END) as pending
      FROM messages
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (params.deviceId) {
      sql += " AND device_id = ?";
      queryParams.push(params.deviceId);
    }

    if (params.startDate) {
      sql += " AND created_at >= ?";
      queryParams.push(params.startDate);
    }

    if (params.endDate) {
      sql += " AND created_at <= ?";
      queryParams.push(params.endDate);
    }

    const res = await queryOne<any>(sql, queryParams);
    return {
      total: Number(res?.total || 0),
      sent: Number(res?.sent || 0),
      failed: Number(res?.failed || 0),
      pending: Number(res?.pending || 0),
    };
  }

  static async create(data: CreateMessageDTO): Promise<Message> {
    const id = uuidv4();
    await query(
      `INSERT INTO messages (id, device_id, user_id, to_number, message, media_url, media_type, status, retry_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 0)`,
      [
        id,
        data.device_id,
        data.user_id,
        data.to_number,
        data.message || "",
        data.media_path || null,
        data.media_type || null,
      ],
    );
    return (await this.findById(id))!;
  }

  static async updateStatus(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    const updates = ["status = ?", "updated_at = NOW()"];
    const params: any[] = [status];

    if (status === "SENT") updates.push("sent_at = NOW()");
    if (status === "DELIVERED") updates.push("delivered_at = NOW()");
    if (status === "READ") updates.push("read_at = NOW()");

    if (errorMessage) {
      updates.push("error_message = ?");
      params.push(errorMessage);
    }
    params.push(id);

    await query(
      `UPDATE messages SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async incrementRetry(id: string): Promise<void> {
    await query(
      "UPDATE messages SET retry_count = retry_count + 1, updated_at = NOW() WHERE id = ?",
      [id],
    );
  }

  static async getHourlyStats(
    deviceId?: string,
    hours: number = 24,
  ): Promise<Array<{ hour: string; count: number }>> {
    let sql = `
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour, COUNT(*) as count
      FROM messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;
    const params: any[] = [hours];
    if (deviceId) {
      sql += " AND device_id = ?";
      params.push(deviceId);
    }
    sql += " GROUP BY hour ORDER BY hour ASC";
    return query(sql, params);
  }

  static async findByDeviceId(
    deviceId: string,
    params: { limit: number },
  ): Promise<Message[]> {
    return query<Message[]>(
      "SELECT * FROM messages WHERE device_id = ? ORDER BY created_at DESC LIMIT ?",
      [deviceId, params.limit],
    );
  }

  static async bulkCreate(messages: CreateMessageDTO[]): Promise<Message[]> {
    if (messages.length === 0) return [];

    const values: any[] = [];
    const placeholders: string[] = [];

    for (const data of messages) {
      const id = uuidv4();
      placeholders.push("(?, ?, ?, ?, ?, ?, ?, 'PENDING', 0)");
      values.push(
        id,
        data.device_id,
        data.user_id,
        data.to_number,
        data.message || "",
        data.media_path || null,
        data.media_type || null,
      );
    }

    const sql = `INSERT INTO messages (id, device_id, user_id, to_number, message, media_url, media_type, status, retry_count) VALUES ${placeholders.join(", ")}`;
    await query(sql, values);

    return query<Message[]>(
      `SELECT * FROM messages WHERE id IN (${values
        .filter((_, i) => i % 8 === 0)
        .map(() => "?")
        .join(",")})`,
      values.filter((_, i) => i % 8 === 0),
    );
  }

  static async deleteOldMessages(days: number = 30): Promise<number> {
    const result: any = await query(
      `DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days],
    );
    return result.affectedRows || 0;
  }
}
```

### Path: src/lib/db/queries/template.queries.ts

```typescript
import { query, queryOne } from "../index";
import { MessageTemplate } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export class TemplateQueries {
  static async findById(id: string): Promise<MessageTemplate | null> {
    return queryOne<MessageTemplate>(
      "SELECT * FROM message_templates WHERE id = ?",
      [id],
    );
  }

  static async findByUserId(userId: string): Promise<MessageTemplate[]> {
    return query<MessageTemplate[]>(
      "SELECT * FROM message_templates WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
  }

  static async create(data: {
    name: string;
    content: string;
    variables?: Record<string, string> | null;
    user_id: string;
  }): Promise<MessageTemplate> {
    const id = uuidv4();

    await query(
      `INSERT INTO message_templates (id, name, content, variables, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.content,
        data.variables ? JSON.stringify(data.variables) : null,
        data.user_id,
      ],
    );

    const template = await this.findById(id);
    if (!template) {
      throw new Error("Failed to create template");
    }

    return template;
  }

  static async update(
    id: string,
    data: Partial<{
      name: string;
      content: string;
      variables: Record<string, string> | null;
    }>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.content !== undefined) {
      updates.push("content = ?");
      params.push(data.content);
    }

    if (data.variables !== undefined) {
      updates.push("variables = ?");
      params.push(data.variables ? JSON.stringify(data.variables) : null);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE message_templates SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async delete(id: string): Promise<void> {
    await query("DELETE FROM message_templates WHERE id = ?", [id]);
  }
}
```

### Path: src/lib/services/backup.service.ts

```typescript
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { appConfig } from "@/config/app.config";

const execAsync = promisify(exec);

export class BackupService {
  private static backupsDir = path.join(process.cwd(), "backups");

  static ensureBackupsDirectory(): void {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  static async createBackup(): Promise<string> {
    this.ensureBackupsDirectory();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(this.backupsDir, filename);

    const configFile = this.createMyCnfFile();

    try {
      const command = `mysqldump --defaults-extra-file=${configFile} ${appConfig.database.database} > ${filepath}`;
      await execAsync(command);
      console.log(`Backup created: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error("Backup failed:", error);
      throw new Error("Failed to create backup");
    } finally {
      this.cleanupMyCnfFile(configFile);
    }
  }

  static async restoreBackup(filepath: string): Promise<void> {
    if (!fs.existsSync(filepath)) {
      throw new Error("Backup file not found");
    }

    const configFile = this.createMyCnfFile();

    try {
      const command = `mysql --defaults-extra-file=${configFile} ${appConfig.database.database} < ${filepath}`;
      await execAsync(command);
      console.log(`Backup restored from: ${filepath}`);
    } catch (error) {
      console.error("Restore failed:", error);
      throw new Error("Failed to restore backup");
    } finally {
      this.cleanupMyCnfFile(configFile);
    }
  }

  private static createMyCnfFile(): string {
    const configPath = path.join(this.backupsDir, `.my.cnf.${Date.now()}`);
    const configContent = `[client]
host=${appConfig.database.host}
port=${appConfig.database.port}
user=${appConfig.database.user}
password=${appConfig.database.password}
`;
    fs.writeFileSync(configPath, configContent, { mode: 0o600 });
    return configPath;
  }

  private static cleanupMyCnfFile(configPath: string): void {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }

  static async listBackups(): Promise
    Array<{
      filename: string;
      filepath: string;
      size: number;
      created_at: Date;
    }>
  > {
    this.ensureBackupsDirectory();

    const files = fs.readdirSync(this.backupsDir);
    const backups = files
      .filter((file) => file.endsWith(".sql"))
      .map((file) => {
        const filepath = path.join(this.backupsDir, file);
        const stats = fs.statSync(filepath);

        return {
          filename: file,
          filepath,
          size: stats.size,
          created_at: stats.mtime,
        };
      })
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return backups;
  }

  static async deleteBackup(filepath: string): Promise<void> {
    if (!fs.existsSync(filepath)) {
      throw new Error("Backup file not found");
    }

    fs.unlinkSync(filepath);
    console.log(`Backup deleted: ${filepath}`);
  }

  static async cleanupOldBackups(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const backups = await this.listBackups();
    let deleted = 0;

    for (const backup of backups) {
      if (backup.created_at < cutoffDate) {
        await this.deleteBackup(backup.filepath);
        deleted++;
      }
    }

    return deleted;
  }
}
```

### Path: src/lib/services/contact.service.ts

```typescript
import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { Contact, CreateContactDTO } from "@/types/database.types";
import { parse } from "csv-parse/sync";
import * as vcf from "vcf";

export class ContactService {
  static async createContact(data: CreateContactDTO): Promise<Contact> {
    const existing = await queryOne(
      "SELECT * FROM contacts WHERE phone_number = ? AND user_id = ?",
      [data.phone_number, data.user_id],
    );

    if (existing) {
      throw new Error("Contact with this phone number already exists");
    }

    const id = uuidv4();
    await query(
      `INSERT INTO contacts (id, name, phone_number, email, tags, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.phone_number,
        data.email || null,
        data.tags ? JSON.stringify(data.tags) : null,
        data.user_id,
      ],
    );

    const contact = await queryOne<Contact>(
      "SELECT * FROM contacts WHERE id = ?",
      [id],
    );

    if (!contact) {
      throw new Error("Failed to create contact");
    }

    return contact;
  }

  static async getUserContacts(
    userId: string,
    params?: {
      search?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Contact[]> {
    let sql = "SELECT * FROM contacts WHERE user_id = ?";
    const queryParams: any[] = [userId];

    if (params?.search) {
      sql += " AND (name LIKE ? OR phone_number LIKE ?)";
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    sql += " ORDER BY name ASC";

    if (params?.limit) {
      sql += " LIMIT ?";
      queryParams.push(params.limit);

      if (params?.offset) {
        sql += " OFFSET ?";
        queryParams.push(params.offset);
      }
    }

    return query<Contact[]>(sql, queryParams);
  }

  static async getContact(id: string): Promise<Contact | null> {
    return queryOne<Contact>("SELECT * FROM contacts WHERE id = ?", [id]);
  }

  static async updateContact(
    id: string,
    data: Partial<CreateContactDTO>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name) {
      updates.push("name = ?");
      params.push(data.name);
    }

    if (data.phone_number) {
      updates.push("phone_number = ?");
      params.push(data.phone_number);
    }

    if (data.email !== undefined) {
      updates.push("email = ?");
      params.push(data.email);
    }

    if (data.tags !== undefined) {
      updates.push("tags = ?");
      params.push(data.tags ? JSON.stringify(data.tags) : null);
    }

    if (updates.length === 0) {
      return;
    }

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE contacts SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async deleteContact(id: string): Promise<void> {
    await query("DELETE FROM contacts WHERE id = ?", [id]);
  }

  static async deleteMultipleContacts(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => "?").join(",");
    const result: any = await query(
      `DELETE FROM contacts WHERE id IN (${placeholders})`,
      ids,
    );

    return result.affectedRows || 0;
  }

  static async importFromCSV(
    csvContent: string,
    userId: string,
  ): Promise<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let imported = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2;

      try {
        if (!row.name || !row.phone_number) {
          throw new Error("Missing required fields: name or phone_number");
        }

        await this.createContact({
          name: row.name,
          phone_number: row.phone_number,
          email: row.email || undefined,
          tags: row.tags
            ? row.tags.split(",").map((t: string) => t.trim())
            : undefined,
          user_id: userId,
        });

        imported++;
      } catch (error: any) {
        failed++;
        errors.push({
          row: rowNumber,
          error: error.message,
        });
      }
    }

    return { imported, failed, errors };
  }

  static async importFromVCF(
    vcfContent: string,
    userId: string,
  ): Promise<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const cards = vcf.parse(vcfContent);

    let imported = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const rowNumber = i + 1;

      try {
        const name = card.get("fn")?.valueOf() || "Unknown";
        const tel = card.get("tel");

        if (!tel) {
          throw new Error("No phone number found");
        }

        const phoneNumber =
          typeof tel.valueOf() === "string" ? tel.valueOf() : tel.valueOf()[0];

        const email = card.get("email")?.valueOf();

        await this.createContact({
          name,
          phone_number: phoneNumber,
          email: typeof email === "string" ? email : undefined,
          user_id: userId,
        });

        imported++;
      } catch (error: any) {
        failed++;
        errors.push({
          row: rowNumber,
          error: error.message,
        });
      }
    }

    return { imported, failed, errors };
  }

  static async exportToCSV(userId: string): Promise<string> {
    const contacts = await this.getUserContacts(userId);

    const headers = ["name", "phone_number", "email", "tags"];
    const rows = contacts.map((contact) => [
      contact.name,
      contact.phone_number,
      contact.email || "",
      contact.tags ? contact.tags.join(",") : "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csv;
  }

  static async countUserContacts(userId: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM contacts WHERE user_id = ?",
      [userId],
    );
    return result?.count || 0;
  }
}
```

### Path: src/lib/services/device.service.ts

```typescript
import { DeviceQueries } from "../db/queries/device.queries";
import { whatsappClientManager } from "../whatsapp/client-manager";
import { DeviceStatus, CreateDeviceDTO } from "@/types/database.types";

export class DeviceService {
  static async createDevice(data: CreateDeviceDTO) {
    const count = await DeviceQueries.countByUser(data.user_id);
    if (count >= 10) throw new Error("Maximum device limit reached");

    const device = await DeviceQueries.create(data);

    whatsappClientManager
      .initializeClient(device.id, device.phone_number)
      .catch((err) =>
        console.error(`[DeviceService] Init failed for ${device.id}`, err),
      );

    return device;
  }

  static async getDevice(id: string) {
    return DeviceQueries.findById(id);
  }

  static async getUserDevices(userId: string) {
    return DeviceQueries.findWithStats(userId);
  }

  static async getQRCode(deviceId: string) {
    const qrCode = whatsappClientManager.getQRCode(deviceId);
    const status =
      whatsappClientManager.getClientStatus(deviceId) ||
      DeviceStatus.DISCONNECTED;
    return { qrCode, status };
  }

  static async deleteDevice(deviceId: string) {
    await whatsappClientManager.disconnectClient(deviceId);
    await DeviceQueries.delete(deviceId);
  }

  static async reconnectDevice(deviceId: string) {
    const device = await DeviceQueries.findById(deviceId);
    if (!device) throw new Error("Device not found");

    await whatsappClientManager.disconnectClient(deviceId);
    setTimeout(() => {
      whatsappClientManager.initializeClient(device.id, device.phone_number);
    }, 1000);
  }
}
```

### Path: src/lib/services/email.service.ts

```typescript
import nodemailer from "nodemailer";
import { logger } from "./logger.service";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM || '"WhatsApp Dashboard" <noreply@example.com>',
        ...options,
      });

      logger.info(`Email sent: ${info.messageId}`, { to: options.to });
      return true;
    } catch (error) {
      logger.error("Failed to send email", { error, to: options.to });
      return false;
    }
  }

  static async sendLoginNotification(
    email: string,
    ip: string,
    userAgent: string,
  ) {
    return this.sendEmail({
      to: email,
      subject: "New Login Detected",
      html: `
        <h3>New Login Detected</h3>
        <p>A new login was detected for your account.</p>
        <ul>
          <li><strong>IP Address:</strong> ${ip}</li>
          <li><strong>Device:</strong> ${userAgent}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>If this wasn't you, please contact support immediately.</p>
      `,
    });
  }
}
```

### Path: src/lib/services/logger.service.ts

```typescript
import winston from "winston";
import { appConfig } from "@/config/app.config";
import * as fs from "fs";
import * as path from "path";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: appConfig.isDevelopment ? "debug" : "info",
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

if (appConfig.isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    }),
  );
}

export const logError = (error: unknown, context?: string) => {
  if (error instanceof Error) {
    logger.error(error.message, {
      stack: error.stack,
      context,
    });
  } else {
    logger.error(String(error), { context });
  }
};

export const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta);
};

export const logWarning = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta);
};
```

### Path: src/lib/services/message.service.ts

```typescript
import { MessageQueries } from "../db/queries/message.queries";
import { DeviceQueries } from "../db/queries/device.queries";
import { messageQueue } from "../whatsapp/message-queue";
import type { CreateMessageDTO } from "@/types/database.types";

export class MessageService {
  static async sendMessage(data: CreateMessageDTO) {
    const device = await DeviceQueries.findById(data.device_id);
    if (!device) throw new Error("Device not found");

    const message = await MessageQueries.create(data);
    await messageQueue.addMessage(message.id, data.device_id);

    return message;
  }

  static async sendBulkMessages(params: {
    userId: string;
    contacts: Array<{ phoneNumber: string; name?: string }>;
    message: string;
    deviceIds?: string[];
    useRoundRobin?: boolean;
  }) {
    let devices = await DeviceQueries.findWithStats(params.userId);
    devices = devices.filter((d) => d.status === "AUTHENTICATED" && d.is_ready);

    if (devices.length === 0) throw new Error("No active devices found");

    if (params.deviceIds && params.deviceIds.length > 0) {
      devices = devices.filter((d) => params.deviceIds!.includes(d.id));
    }

    if (devices.length === 0)
      throw new Error("Selected devices are not active");

    const results = [];
    let deviceIndex = 0;

    for (const contact of params.contacts) {
      const device = devices[deviceIndex % devices.length];

      const msg = await this.sendMessage({
        device_id: device.id,
        user_id: params.userId,
        to_number: contact.phoneNumber,
        message: params.message.replace("{{name}}", contact.name || ""),
      });

      results.push(msg);

      if (params.useRoundRobin !== false) {
        deviceIndex++;
      }
    }

    return { queued: results.length, total: params.contacts.length };
  }

  static async getUserStats(userId: string) {
    const stats = await MessageQueries.getStatsByUserId(userId);

    const successRate =
      stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

    return {
      ...stats,
      successRate,
    };
  }

  static async getMessageStats(params: {
    deviceId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const stats = await MessageQueries.getDetailedStats(params);

    const successRate =
      stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

    return {
      ...stats,
      successRate,
    };
  }

  static async getHourlyStats(deviceId?: string, hours: number = 24) {
    return MessageQueries.getHourlyStats(deviceId, hours);
  }
}
```

### Path: src/lib/services/pdf-export.service.ts

```typescript
import PDFDocument from "pdfkit";
import { Message } from "@/types/database.types";
import { format } from "date-fns";

export class PdfExportService {
  static async generateMessageReport(
    messages: Message[],
    title: string = "Message Report",
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Header
      doc.fontSize(20).text("WhatsApp Dashboard", { align: "center" });
      doc.moveDown();
      doc.fontSize(16).text(title, { align: "center" });
      doc
        .fontSize(10)
        .text(`Generated: ${format(new Date(), "PPpp")}`, { align: "center" });
      doc.moveDown(2);

      // Table Header
      const tableTop = 150;
      const colDate = 50;
      const colTo = 180;
      const colStatus = 280;
      const colMsg = 380;

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Date", colDate, tableTop);
      doc.text("To", colTo, tableTop);
      doc.text("Status", colStatus, tableTop);
      doc.text("Message", colMsg, tableTop);

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Rows
      let y = tableTop + 25;
      doc.font("Helvetica").fontSize(9);

      messages.forEach((msg) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc.text(
          format(new Date(msg.created_at), "yyyy-MM-dd HH:mm"),
          colDate,
          y,
        );
        doc.text(msg.to_number, colTo, y);
        doc.text(msg.status, colStatus, y);

        // Truncate message for PDF view
        const truncatedMsg =
          msg.message.length > 50
            ? msg.message.substring(0, 47) + "..."
            : msg.message;
        doc.text(truncatedMsg, colMsg, y, { width: 170 });

        y += 20;
      });

      // Footer
      const stats = {
        total: messages.length,
        sent: messages.filter((m) =>
          ["SENT", "DELIVERED", "READ"].includes(m.status),
        ).length,
        failed: messages.filter((m) => m.status === "FAILED").length,
      };

      doc.moveDown(2);
      doc.fontSize(11).font("Helvetica-Bold").text("Summary");
      doc.font("Helvetica").fontSize(10);
      doc.text(`Total Messages: ${stats.total}`);
      doc.text(`Successful: ${stats.sent}`);
      doc.text(`Failed: ${stats.failed}`);

      doc.end();
    });
  }
}
```

### Path: src/lib/services/settings.service.ts

```typescript
import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface SystemSettings {
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  maxDevicesPerUser: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  sessionTimeout: number;
  autoBackupEnabled: boolean;
  autoBackupInterval: number;
}

export class SettingsService {
  private static DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    rateLimitPerMinute: 20,
    rateLimitPerHour: 500,
    maxDevicesPerUser: 10,
    maxRetryAttempts: 3,
    retryDelayMs: 5000,
    sessionTimeout: 2592000,
    autoBackupEnabled: false,
    autoBackupInterval: 86400,
  };

  static async getSystemSettings(): Promise<SystemSettings> {
    const settings: any = await queryOne(
      "SELECT setting_value FROM settings WHERE user_id IS NULL AND setting_key = 'system'",
    );

    if (!settings) {
      return this.DEFAULT_SYSTEM_SETTINGS;
    }

    try {
      return {
        ...this.DEFAULT_SYSTEM_SETTINGS,
        ...JSON.parse(settings.setting_value),
      };
    } catch {
      return this.DEFAULT_SYSTEM_SETTINGS;
    }
  }

  static async updateSystemSettings(
    settings: Partial<SystemSettings>,
  ): Promise<void> {
    const current = await this.getSystemSettings();
    const updated = { ...current, ...settings };

    const existing: any = await queryOne(
      "SELECT id FROM settings WHERE user_id IS NULL AND setting_key = 'system'",
    );

    if (existing) {
      await query(
        "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?",
        [JSON.stringify(updated), existing.id],
      );
    } else {
      const id = uuidv4();
      await query(
        "INSERT INTO settings (id, user_id, setting_key, setting_value) VALUES (?, NULL, 'system', ?)",
        [id, JSON.stringify(updated)],
      );
    }
  }

  static async getUserSettings(userId: string): Promise<Record<string, any>> {
    const settings: any = await queryOne(
      "SELECT setting_value FROM settings WHERE user_id = ? AND setting_key = 'user_preferences'",
      [userId],
    );

    if (!settings) return {};

    try {
      return JSON.parse(settings.setting_value);
    } catch {
      return {};
    }
  }

  static async updateUserSettings(
    userId: string,
    settings: Record<string, any>,
  ): Promise<void> {
    const current = await this.getUserSettings(userId);
    const updated = { ...current, ...settings };

    const existing: any = await queryOne(
      "SELECT id FROM settings WHERE user_id = ? AND setting_key = 'user_preferences'",
      [userId],
    );

    if (existing) {
      await query(
        "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?",
        [JSON.stringify(updated), existing.id],
      );
    } else {
      const id = uuidv4();
      await query(
        "INSERT INTO settings (id, user_id, setting_key, setting_value) VALUES (?, ?, 'user_preferences', ?)",
        [id, userId, JSON.stringify(updated)],
      );
    }
  }

  static async deleteUserSettings(userId: string): Promise<void> {
    await query(
      "DELETE FROM settings WHERE user_id = ? AND setting_key = 'user_preferences'",
      [userId],
    );
  }

  static async getSetting(key: string, userId?: string): Promise<any | null> {
    const settings: any = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = ? AND user_id = ?",
      [key, userId || null],
    );

    if (!settings) return null;

    try {
      return JSON.parse(settings.setting_value);
    } catch {
      return settings.setting_value;
    }
  }

  static async setSetting(
    key: string,
    value: any,
    userId?: string,
  ): Promise<void> {
    const existing: any = await queryOne(
      "SELECT id FROM settings WHERE setting_key = ? AND user_id = ?",
      [key, userId || null],
    );

    const jsonValue = JSON.stringify(value);

    if (existing) {
      await query(
        "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?",
        [jsonValue, existing.id],
      );
    } else {
      const id = uuidv4();
      await query(
        "INSERT INTO settings (id, user_id, setting_key, setting_value) VALUES (?, ?, ?, ?)",
        [id, userId || null, key, jsonValue],
      );
    }
  }
}
```

### Path: src/lib/services/storage.service.ts

```typescript
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export class StorageService {
  private static uploadDir = join(process.cwd(), "public", "uploads");

  static async saveFile(
    file: File,
    folder: string = "media",
  ): Promise<{ path: string; mimeType: string; size: number }> {
    try {
      const targetDir = join(this.uploadDir, folder);
      if (!existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const originalName = file.name || "unknown";
      const extension = originalName.split(".").pop()?.toLowerCase() || "bin";
      const allowedExts = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "mp4",
        "pdf",
        "mp3",
        "ogg",
        "webp",
      ];
      const safeExt = allowedExts.includes(extension) ? extension : "bin";

      const filename = `${uuidv4()}.${safeExt}`;
      const filepath = join(targetDir, filename);

      await writeFile(filepath, buffer);

      return {
        path: `/uploads/${folder}/${filename}`,
        mimeType: file.type,
        size: file.size,
      };
    } catch (error) {
      console.error("Storage save error:", error);
      throw new Error("Failed to save file");
    }
  }

  static async deleteFile(relativePath: string): Promise<boolean> {
    try {
      const cleanPath = relativePath.startsWith("/")
        ? relativePath.substring(1)
        : relativePath;
      const absolutePath = join(process.cwd(), "public", cleanPath);

      if (existsSync(absolutePath)) {
        await unlink(absolutePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Storage delete error:", error);
      return false;
    }
  }

  static getAbsolutePath(relativePath: string): string {
    const cleanPath = relativePath.startsWith("/")
      ? relativePath.substring(1)
      : relativePath;
    return join(process.cwd(), "public", cleanPath);
  }
}
```

### Path: src/lib/services/webhook.service.ts

```typescript
import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import { logError, logInfo } from "./logger.service";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  user_id: string;
  secret: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class WebhookService {
  static async createWebhook(data: {
    url: string;
    events: string[];
    user_id: string;
    secret?: string;
    is_active?: boolean;
  }): Promise<Webhook> {
    const id = uuidv4();

    await query(
      `INSERT INTO webhooks (id, url, events, user_id, secret, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.url,
        JSON.stringify(data.events),
        data.user_id,
        data.secret || null,
        data.is_active !== undefined ? data.is_active : true,
      ],
    );

    const webhook = await queryOne<Webhook>(
      "SELECT * FROM webhooks WHERE id = ?",
      [id],
    );
    if (!webhook) throw new Error("Failed to create webhook");
    return webhook;
  }

  static async getUserWebhooks(userId: string): Promise<Webhook[]> {
    return query<Webhook[]>(
      "SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
  }

  static async getWebhook(id: string): Promise<Webhook | null> {
    return queryOne<Webhook>("SELECT * FROM webhooks WHERE id = ?", [id]);
  }

  static async updateWebhook(
    id: string,
    data: Partial<{
      url: string;
      events: string[];
      secret: string;
      is_active: boolean;
    }>,
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.url !== undefined) {
      updates.push("url = ?");
      params.push(data.url);
    }
    if (data.events !== undefined) {
      updates.push("events = ?");
      params.push(JSON.stringify(data.events));
    }
    if (data.secret !== undefined) {
      updates.push("secret = ?");
      params.push(data.secret);
    }
    if (data.is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(data.is_active);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = NOW()");
    params.push(id);

    await query(
      `UPDATE webhooks SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  static async deleteWebhook(id: string): Promise<void> {
    await query("DELETE FROM webhooks WHERE id = ?", [id]);
  }

  static async triggerWebhook(
    event: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const webhooks = await query<Webhook[]>(
      `SELECT * FROM webhooks 
       WHERE is_active = true 
       AND JSON_CONTAINS(events, ?)`,
      [JSON.stringify(event)],
    );

    if (webhooks.length === 0) return;

    const promises = webhooks.map((webhook) =>
      this.sendWebhookRequest(webhook, event, payload),
    );

    await Promise.allSettled(promises);
  }

  private static async sendWebhookRequest(
    webhook: Webhook,
    event: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const webhookId = webhook.id.substring(0, 8);
    try {
      const timestamp = new Date().toISOString();
      const bodyData = {
        id: uuidv4(),
        event,
        timestamp,
        data: payload,
      };

      const body = JSON.stringify(bodyData);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "WA-Dashboard-Webhook/1.0",
        "X-Webhook-Event": event,
        "X-Webhook-Timestamp": timestamp,
      };

      if (webhook.secret) {
        const signature = crypto
          .createHmac("sha256", webhook.secret)
          .update(body)
          .digest("hex");
        headers["X-Webhook-Signature"] = signature;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        logInfo(`Webhook delivered successfully`, {
          webhookId,
          event,
          status: response.status,
        });
      } else {
        logError(
          new Error(
            `Webhook failed with status ${response.status}: ${await response.text()}`,
          ),
          `webhook-${webhookId}`,
        );
      }
    } catch (error: any) {
      logError(error, `webhook-${webhookId}`);
    }
  }

  static async getWebhookLogs(
    webhookId: string,
    limit: number = 50,
  ): Promise<any[]> {
    return [];
  }
}
```

### Path: src/lib/utils/api-response.ts

```typescript
import { NextResponse } from "next/server";

export function successResponse(data: any, options: { status?: number } = {}) {
  return NextResponse.json(
    { success: true, data },
    { status: options.status || 200 },
  );
}

export function errorResponse(
  message: string,
  statusCode: number,
  code: string,
) {
  return NextResponse.json(
    { success: false, error: { message, code } },
    { status: statusCode },
  );
}

export function paginatedResponse(
  data: any[],
  page: number,
  limit: number,
  total: number,
) {
  const totalPages = Math.ceil(total / limit);
  return NextResponse.json({
    success: true,
    data,
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
}

export function handleApiError(error: any) {
  console.error("[API Error]", error);
  const message =
    error instanceof Error ? error.message : "Internal Server Error";

  if (message.toLowerCase().includes("not found"))
    return errorResponse(message, 404, "NOT_FOUND");
  if (message.toLowerCase().includes("unauthorized"))
    return errorResponse(message, 401, "UNAUTHORIZED");
  if (message.toLowerCase().includes("forbidden"))
    return errorResponse(message, 403, "FORBIDDEN");

  return errorResponse(message, 500, "INTERNAL_ERROR");
}

export const unauthorizedResponse = (message: string = "Unauthorized") =>
  errorResponse(message, 401, "UNAUTHORIZED");

export const forbiddenResponse = (message: string = "Forbidden") =>
  errorResponse(message, 403, "FORBIDDEN");

export const notFoundResponse = (entity: string) =>
  errorResponse(`${entity} Not Found`, 404, "NOT_FOUND");

export const validationErrorResponse = (errors: any) =>
  NextResponse.json(
    { success: false, error: { message: "Validation Error", details: errors } },
    { status: 422 },
  );

export const rateLimitResponse = () =>
  errorResponse("Too Many Requests", 429, "RATE_LIMIT_EXCEEDED");

export const serverErrorResponse = (error: Error) => {
  console.error(error);
  return errorResponse("Internal Server Error", 500, "INTERNAL_ERROR");
};
```

### Path: src/lib/utils/cn.ts

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Path: src/lib/utils/error-handler.ts

```typescript
import { logError } from "@/lib/services/logger.service";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public details?: any,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

export function handleError(error: unknown, context?: string): AppError {
  if (error instanceof AppError) {
    logError(error, context);
    return error;
  }

  if (error instanceof Error) {
    logError(error, context);
    return new AppError(error.message, 500, "INTERNAL_ERROR");
  }

  const unknownError = new AppError(
    "An unknown error occurred",
    500,
    "UNKNOWN_ERROR",
  );
  logError(unknownError, context);
  return unknownError;
}
```

### Path: src/lib/utils/phone-formatter.ts

```typescript
export class PhoneFormatter {
  static formatForWhatsApp(
    phoneNumber: string,
    countryCode: string = "62",
  ): string {
    let formatted = phoneNumber.replace(/\D/g, "");

    if (formatted.startsWith("0")) {
      formatted = countryCode + formatted.substring(1);
    } else if (!formatted.startsWith(countryCode)) {
      formatted = countryCode + formatted;
    }

    formatted = formatted.slice(0, 15);

    if (!formatted.endsWith("@c.us")) {
      formatted = `${formatted}@c.us`;
    }

    return formatted;
  }

  static validate(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  static normalize(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, "").slice(0, 15);
  }

  static format(
    phoneNumber: string,
    format: "international" | "local" = "international",
  ): string {
    const cleaned = this.normalize(phoneNumber);

    if (format === "international") {
      if (cleaned.startsWith("62")) {
        return `+${cleaned}`;
      }
      return `+62${cleaned}`;
    }

    if (cleaned.startsWith("62")) {
      return `0${cleaned.substring(2)}`;
    }

    return cleaned.startsWith("0") ? cleaned : `0${cleaned}`;
  }

  static sanitize(phoneNumber: string): string {
    return this.normalize(phoneNumber);
  }
}
```

### Path: src/lib/utils/rate-limiter.ts

```typescript
import { queryOne } from "@/lib/db";
import { appConfig } from "@/config/app.config";

interface RateLimitConfig {
  perMinute?: number;
  perHour?: number;
}

export class RateLimiter {
  static async checkLimit(
    deviceId: string,
    config?: RateLimitConfig,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const perMinute = config?.perMinute || appConfig.rateLimit.perMinute;
    const perHour = config?.perHour || appConfig.rateLimit.perHour;

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const minuteCount: any = await queryOne(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? 
       AND created_at >= ?`,
      [deviceId, oneMinuteAgo],
    );

    if (minuteCount && minuteCount.count >= perMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: Max ${perMinute} messages per minute`,
      };
    }

    const hourCount: any = await queryOne(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? 
       AND created_at >= ?`,
      [deviceId, oneHourAgo],
    );

    if (hourCount && hourCount.count >= perHour) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: Max ${perHour} messages per hour`,
      };
    }

    return { allowed: true };
  }

  static async getUsage(deviceId: string): Promise<{
    lastMinute: number;
    lastHour: number;
  }> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const minuteCount: any = await queryOne(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? AND created_at >= ?`,
      [deviceId, oneMinuteAgo],
    );

    const hourCount: any = await queryOne(
      `SELECT COUNT(*) as count FROM messages
       WHERE device_id = ? AND created_at >= ?`,
      [deviceId, oneHourAgo],
    );

    return {
      lastMinute: minuteCount?.count || 0,
      lastHour: hourCount?.count || 0,
    };
  }
}
```

### Path: src/lib/utils/storage.ts

```typescript
import * as fs from "fs";
import * as path from "path";

export class StorageService {
  private static uploadsDir = path.join(process.cwd(), "public", "uploads");
  private static backupsDir = path.join(process.cwd(), "backups");

  static ensureDirectories(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  static async saveUpload(file: File, userId: string): Promise<string> {
    this.ensureDirectories();

    const userDir = path.join(this.uploadsDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const filepath = path.join(userDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    // Return relative path for public access
    return `/uploads/${userId}/${filename}`;
  }

  static async deleteUpload(filepath: string): Promise<void> {
    // Convert relative public path to absolute system path if needed
    let absolutePath = filepath;
    if (filepath.startsWith("/uploads")) {
      absolutePath = path.join(process.cwd(), "public", filepath);
    }

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }

  static async cleanupOldUploads(days: number = 7): Promise<number> {
    let deleted = 0;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const processDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);

        if (stats.isDirectory()) {
          processDir(filepath);
          // Remove empty directories
          if (fs.readdirSync(filepath).length === 0) {
            fs.rmdirSync(filepath);
          }
        } else if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filepath);
          deleted++;
        }
      }
    };

    processDir(this.uploadsDir);
    return deleted;
  }
}
```

### Path: src/lib/validations/schemas.ts

```typescript
import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .min(5, "Nomor terlalu pendek")
  .max(20, "Nomor terlalu panjang")
  .transform((val) => {
    let cleaned = val.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.substring(1);
    }
    if (!cleaned.startsWith("62")) {
      cleaned = "62" + cleaned;
    }
    return cleaned.slice(0, 15);
  });

export const createDeviceSchema = z.object({
  name: z.string().min(1, "Nama device wajib diisi").max(50),
  phoneNumber: phoneNumberSchema,
});

export const sendMessageSchema = z.object({
  deviceId: z.string().uuid("Device ID tidak valid").optional(),
  toNumber: phoneNumberSchema,
  message: z.string().min(1, "Pesan tidak boleh kosong"),
});

export const sendBulkMessageSchema = z.object({
  deviceId: z.string().uuid().optional(),
  deviceIds: z.array(z.string().uuid()).optional(),
  message: z.string().min(1, "Pesan tidak boleh kosong"),
  contacts: z
    .array(
      z.object({
        phoneNumber: phoneNumberSchema,
        name: z.string().optional(),
      }),
    )
    .min(1, "Minimal 1 kontak tujuan")
    .max(1000, "Maksimal 1000 kontak per batch"),
  useRoundRobin: z.boolean().default(true),
});

export const createContactSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phoneNumber: phoneNumberSchema,
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Nama template wajib diisi"),
  content: z.string().min(1, "Isi template wajib diisi"),
  variables: z.record(z.string(), z.string()).optional().nullable(),
});

export const createAutoResponseSchema = z.object({
  keyword: z.string().min(1, "Keyword wajib diisi"),
  response: z.string().min(1, "Response wajib diisi"),
  deviceId: z.string().uuid("Device ID tidak valid"),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Nama API Key wajib diisi").max(50),
});

export const updateWebhookSchema = z.object({
  url: z.string().url("URL tidak valid").optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  is_active: z.boolean().optional(),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true as const, data: result.data };
  }
  return {
    success: false as const,
    errors: result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  };
}
```

### Path: src/lib/whatsapp/client-manager.ts

```typescript
import { Client, LocalAuth, Message, MessageMedia } from "whatsapp-web.js";
import {
  DeviceStatus,
  MessageStatus,
  MessageDirection,
} from "@/types/database.types";
import { query, queryOne } from "@/lib/db";
import { appConfig } from "@/config/app.config";
import { WebhookService } from "@/lib/services/webhook.service";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

const globalForWhatsapp = global as unknown as {
  whatsappClientManager: WhatsAppClientManager | undefined;
};

interface WhatsAppClientInstance {
  client: Client;
  deviceId: string;
  status: DeviceStatus;
  qrCode?: string;
  lastActivity?: Date;
}

export class WhatsAppClientManager {
  private clients: Map<string, WhatsAppClientInstance> = new Map();
  private sessionPath: string;
  private initializationLocks: Map<string, Promise<void>> = new Map();

  constructor() {
    this.sessionPath = appConfig.whatsapp.sessionPath;
    this.ensureSessionDirectory();
    this.startHealthCheck();
    this.setupSignalHandlers();
  }

  private ensureSessionDirectory(): void {
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }
  }

  private setupSignalHandlers() {
    if (process.env.NODE_ENV === "production") {
      const handleShutdown = async (signal: string) => {
        console.log(`${signal} received, disconnecting all clients...`);
        await this.disconnectAllClients();
        process.exit(0);
      };

      process.removeAllListeners("SIGTERM");
      process.removeAllListeners("SIGINT");

      process.on("SIGTERM", () => handleShutdown("SIGTERM"));
      process.on("SIGINT", () => handleShutdown("SIGINT"));
    }
  }

  async postStatus(
    deviceId: string,
    text: string,
    mediaPath?: string,
  ): Promise<void> {
    const instance = this.clients.get(deviceId);
    if (!instance?.client || instance.status !== DeviceStatus.AUTHENTICATED) {
      throw new Error("Device not ready");
    }

    try {
      const statusJid = "status@broadcast";

      if (mediaPath) {
        const absolutePath = path.join(process.cwd(), "public", mediaPath);
        if (!fs.existsSync(absolutePath)) {
          throw new Error("Media file not found");
        }
        const media = MessageMedia.fromFilePath(absolutePath);
        await instance.client.sendMessage(statusJid, media, {
          caption: text || "",
        });
      } else if (text) {
        await instance.client.sendMessage(statusJid, text, {
          backgroundColor: "#3b82f6",
          font: 1,
        });
      } else {
        throw new Error("Content required (text or media)");
      }

      console.log(`[Status] Posted for device ${deviceId}`);
    } catch (error: any) {
      console.error(`[Status] Failed:`, error);
      throw new Error(`Failed to post status: ${error.message}`);
    }
  }

  async initializeClient(deviceId: string, phoneNumber: string): Promise<void> {
    if (this.initializationLocks.has(deviceId)) {
      await this.initializationLocks.get(deviceId);
      return;
    }

    if (this.clients.has(deviceId)) {
      const existing = this.clients.get(deviceId);
      if (existing?.client && existing.status === DeviceStatus.AUTHENTICATED) {
        return;
      }
    }

    const initPromise = this._doInitialize(deviceId, phoneNumber);
    this.initializationLocks.set(deviceId, initPromise);

    try {
      await initPromise;
    } finally {
      this.initializationLocks.delete(deviceId);
    }
  }

  private async _doInitialize(
    deviceId: string,
    _phoneNumber: string,
  ): Promise<void> {
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: deviceId,
        dataPath: this.sessionPath,
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      },
      webVersionCache: {
        type: "remote",
        remotePath:
          "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
      },
    });

    this.clients.set(deviceId, {
      client,
      deviceId,
      status: DeviceStatus.CONNECTING,
      lastActivity: new Date(),
    });

    this.setupClientEvents(client, deviceId);

    try {
      await Promise.race([
        client.initialize(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Initialization timeout")), 120000),
        ),
      ]);

      await this.updateDeviceStatus(deviceId, DeviceStatus.CONNECTING);
    } catch (error) {
      console.error(
        `Failed to initialize client for device ${deviceId}:`,
        error,
      );
      await this.updateDeviceStatus(deviceId, DeviceStatus.ERROR);
      this.clients.delete(deviceId);
    }
  }

  private setupClientEvents(client: Client, deviceId: string): void {
    client.on("qr", async (qr: string) => {
      const instance = this.clients.get(deviceId);
      if (instance) {
        instance.qrCode = qr;
        instance.status = DeviceStatus.QR_READY;
        instance.lastActivity = new Date();
        await this.updateDeviceStatus(deviceId, DeviceStatus.QR_READY);
      }
    });

    client.on("ready", async () => {
      const instance = this.clients.get(deviceId);
      if (instance) {
        instance.status = DeviceStatus.AUTHENTICATED;
        instance.qrCode = undefined;
        instance.lastActivity = new Date();
        await this.updateDeviceStatus(
          deviceId,
          DeviceStatus.AUTHENTICATED,
          true,
        );
      }
    });

    client.on("authenticated", async () => {
      await this.updateDeviceStatus(deviceId, DeviceStatus.CONNECTED);
    });

    client.on("disconnected", async () => {
      await this.updateDeviceStatus(deviceId, DeviceStatus.DISCONNECTED, false);
      this.clients.delete(deviceId);
    });

    client.on("message_ack", async (msg, ack) => {
      let status = MessageStatus.SENT;
      if (ack === 1) status = MessageStatus.SENT;
      if (ack === 2) status = MessageStatus.DELIVERED;
      if (ack === 3) status = MessageStatus.READ;

      WebhookService.triggerWebhook("message.status", {
        deviceId,
        status,
        ackRaw: ack,
        timestamp: new Date(),
      }).catch(console.error);
    });

    client.on("message", async (message: Message) => {
      const instance = this.clients.get(deviceId);
      if (instance) instance.lastActivity = new Date();
      await this.handleIncomingMessage(deviceId, message);
    });
  }

  private async handleIncomingMessage(
    deviceId: string,
    message: Message,
  ): Promise<void> {
    try {
      if (message.fromMe) return;

      const device = await this.getDeviceUserId(deviceId);
      if (!device) return;

      const fromNumber = message.from.replace("@c.us", "");
      const messageBody = message.body;

      const messageId = uuidv4();
      await query(
        `INSERT INTO messages 
        (id, device_id, user_id, from_number, to_number, message, direction, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          messageId,
          deviceId,
          device.user_id,
          fromNumber,
          device.phone_number,
          messageBody,
          MessageDirection.INBOUND,
          MessageStatus.DELIVERED,
        ],
      );

      await WebhookService.triggerWebhook("message.received", {
        messageId,
        deviceId,
        from: fromNumber,
        message: messageBody,
        timestamp: new Date(),
      });

      const rules: any[] = await query(
        `SELECT * FROM auto_response_rules
         WHERE device_id = ? AND is_active = true
         ORDER BY priority DESC`,
        [deviceId],
      );

      for (const rule of rules) {
        if (messageBody.toLowerCase().includes(rule.keyword.toLowerCase())) {
          await message.reply(rule.response);

          const replyId = uuidv4();
          await query(
            `INSERT INTO messages 
            (id, device_id, user_id, to_number, message, direction, status, sent_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              replyId,
              deviceId,
              device.user_id,
              fromNumber,
              rule.response,
              MessageDirection.OUTBOUND,
              MessageStatus.SENT,
            ],
          );
          break;
        }
      }
    } catch (error) {
      console.error("Error handling incoming message:", error);
    }
  }

  private async getDeviceUserId(
    deviceId: string,
  ): Promise<{ user_id: string; phone_number: string } | null> {
    const res: any = await queryOne(
      "SELECT user_id, phone_number FROM devices WHERE id = ?",
      [deviceId],
    );
    return res;
  }

  private async updateDeviceStatus(
    deviceId: string,
    status: DeviceStatus,
    isReady: boolean = false,
  ): Promise<void> {
    try {
      await query(
        `UPDATE devices
         SET status = ?, is_ready = ?, last_seen = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [status, isReady, deviceId],
      );
    } catch (error) {
      console.error("Error updating device status:", error);
    }
  }

  async sendMessage(
    deviceId: string,
    phoneNumber: string,
    message: string,
    messageId: string,
    mediaPath?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const instance = this.clients.get(deviceId);

      if (!instance?.client) {
        return { success: false, error: "Device not initialized" };
      }

      if (
        instance.status !== DeviceStatus.AUTHENTICATED &&
        instance.status !== DeviceStatus.CONNECTED
      ) {
        return { success: false, error: "Device not authenticated" };
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      try {
        const isRegistered =
          await instance.client.isRegisteredUser(formattedNumber);
        if (!isRegistered) {
          return {
            success: false,
            error: "Phone number not registered on WhatsApp",
          };
        }
      } catch (e) {
        console.warn("Skipping registration check due to error/timeout");
      }

      if (mediaPath) {
        const absolutePath = path.join(process.cwd(), "public", mediaPath);

        if (!fs.existsSync(absolutePath)) {
          return {
            success: false,
            error: "File media tidak ditemukan di server",
          };
        }

        const media = MessageMedia.fromFilePath(absolutePath);
        await instance.client.sendMessage(formattedNumber, media, {
          caption: message || "",
        });
      } else {
        if (!message) return { success: false, error: "Pesan kosong" };
        await instance.client.sendMessage(formattedNumber, message);
      }

      instance.lastActivity = new Date();

      await query(
        `UPDATE messages
         SET status = ?, sent_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [MessageStatus.SENT, messageId],
      );

      return { success: true };
    } catch (error: any) {
      console.error("Error sending message:", error);
      return { success: false, error: error.message };
    }
  }

  async checkNumber(
    deviceId: string,
    phoneNumber: string,
  ): Promise<{
    registered: boolean;
    formattedNumber?: string;
    error?: string;
  }> {
    const instance = this.clients.get(deviceId);
    if (!instance?.client) {
      return { registered: false, error: "Device not ready" };
    }

    if (instance.status !== DeviceStatus.AUTHENTICATED) {
      return { registered: false, error: "Device not authenticated" };
    }

    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      const isRegistered = await instance.client.isRegisteredUser(formatted);
      return {
        registered: isRegistered,
        formattedNumber: formatted.replace("@c.us", ""),
      };
    } catch (error: any) {
      console.error("Error checking number:", error);
      return { registered: false, error: error.message };
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let formatted = phoneNumber.replace(/\D/g, "");
    if (!formatted.startsWith("62") && formatted.startsWith("0")) {
      formatted = "62" + formatted.substring(1);
    }
    if (!formatted.endsWith("@c.us")) {
      formatted = `${formatted}@c.us`;
    }
    return formatted;
  }

  getQRCode(deviceId: string): string | undefined {
    return this.clients.get(deviceId)?.qrCode;
  }

  getClientStatus(deviceId: string): DeviceStatus | undefined {
    return this.clients.get(deviceId)?.status;
  }

  isClientReady(deviceId: string): boolean {
    const instance = this.clients.get(deviceId);
    return instance?.status === DeviceStatus.AUTHENTICATED;
  }

  async disconnectClient(deviceId: string): Promise<void> {
    const instance = this.clients.get(deviceId);
    if (instance?.client) {
      try {
        await instance.client.destroy();
      } catch (error) {
        console.error(`Error destroying client for device ${deviceId}:`, error);
      }
      this.clients.delete(deviceId);
      await this.updateDeviceStatus(deviceId, DeviceStatus.DISCONNECTED, false);
    }
  }

  async disconnectAllClients(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((deviceId) =>
      this.disconnectClient(deviceId),
    );
    await Promise.all(promises);
  }

  getActiveClients(): string[] {
    return Array.from(this.clients.keys());
  }

  private startHealthCheck(): void {
    setInterval(
      () => {
        const now = new Date();
        const staleThreshold = 30 * 60 * 1000;
        for (const [deviceId, instance] of this.clients.entries()) {
          if (instance.lastActivity) {
            const timeSinceActivity =
              now.getTime() - instance.lastActivity.getTime();
            if (timeSinceActivity > staleThreshold) {
              console.log(`[Health Check] Stale client detected: ${deviceId}`);
            }
          }
        }
      },
      5 * 60 * 1000,
    );
  }
}

export const whatsappClientManager =
  globalForWhatsapp.whatsappClientManager || new WhatsAppClientManager();

if (process.env.NODE_ENV !== "production") {
  globalForWhatsapp.whatsappClientManager = whatsappClientManager;
}
```

### Path: src/lib/whatsapp/message-queue.ts

```typescript
import { query, queryOne } from "../db";
import { whatsappClientManager } from "./client-manager";
import { MessageStatus } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

const globalForQueue = global as unknown as {
  messageQueue: MessageQueue | undefined;
};

interface QueueItem {
  id: string;
  messageId: string;
  deviceId: string;
  priority: number;
  scheduledAt: Date;
  retries: number;
}

class MessageQueue {
  private queue: QueueItem[] = [];
  private processing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly maxConcurrent = 3;
  private readonly retryDelay = parseInt(process.env.RETRY_DELAY_MS || "5000");
  private readonly maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || "3");
  private readonly maxQueueSize = 10000;

  constructor() {
    this.loadPendingMessages();
    this.startProcessing();
    this.setupSignalHandlers();
  }

  async loadPendingMessages() {
    try {
      const pending: any[] = await query(
        `SELECT * FROM message_queue WHERE status = 'PENDING' ORDER BY priority DESC, scheduled_at ASC LIMIT ?`,
        [this.maxQueueSize],
      );
      for (const item of pending) {
        this.queue.push({
          id: item.id,
          messageId: item.message_id,
          deviceId: item.device_id,
          priority: item.priority,
          scheduledAt: new Date(item.scheduled_at),
          retries: 0,
        });
      }
      console.log(`Loaded ${pending.length} pending messages into queue`);
    } catch (error) {
      console.error("Failed to load pending messages:", error);
    }
  }

  private setupSignalHandlers() {
    if (process.env.NODE_ENV === "production") {
      const cleanup = () => {
        this.stopProcessing();
      };
      process.on("SIGTERM", cleanup);
      process.on("SIGINT", cleanup);
    }
  }

  async addMessage(
    messageId: string,
    deviceId: string,
    priority: number = 0,
    scheduledAt: Date = new Date(),
  ) {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error("Queue is full");
    }

    const queueId = uuidv4();
    await query(
      `INSERT INTO message_queue (id, message_id, device_id, priority, scheduled_at, status) VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [queueId, messageId, deviceId, priority, scheduledAt],
    );
    this.queue.push({
      id: queueId,
      messageId,
      deviceId,
      priority,
      scheduledAt,
      retries: 0,
    });
    this.queue.sort(
      (a, b) =>
        b.priority - a.priority ||
        a.scheduledAt.getTime() - b.scheduledAt.getTime(),
    );
  }

  private startProcessing() {
    if (this.processingInterval) return;
    this.processingInterval = setInterval(async () => {
      if (!this.processing && this.queue.length > 0) await this.processQueue();
    }, 1000);
  }

  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;
    try {
      const now = new Date();
      const readyMessages = this.queue.filter(
        (item) => item.scheduledAt <= now,
      );
      if (readyMessages.length === 0) {
        this.processing = false;
        return;
      }
      const batch = readyMessages.slice(0, this.maxConcurrent);
      await Promise.all(batch.map((item) => this.processMessage(item)));
    } catch (error) {
      console.error("Error processing queue:", error);
    } finally {
      this.processing = false;
    }
  }

  private async processMessage(item: QueueItem) {
    try {
      const message: any = await queryOne(
        "SELECT * FROM messages WHERE id = ?",
        [item.messageId],
      );
      if (!message) {
        await this.removeFromQueue(item.id);
        return;
      }

      await query(
        `UPDATE messages SET status = ?, updated_at = NOW() WHERE id = ?`,
        [MessageStatus.SENDING, item.messageId],
      );
      await query(
        `UPDATE message_queue SET status = 'PROCESSING', processed_at = NOW() WHERE id = ?`,
        [item.id],
      );

      const result = await whatsappClientManager.sendMessage(
        item.deviceId,
        message.to_number,
        message.message,
        item.messageId,
        message.media_url || undefined,
      );

      if (result.success) {
        await this.removeFromQueue(item.id);
        await query(
          `UPDATE message_queue SET status = 'COMPLETED' WHERE id = ?`,
          [item.id],
        );
      } else {
        await this.handleFailure(item, result.error || "Unknown error");
      }
    } catch (error: any) {
      await this.handleFailure(item, error.message);
    }
  }

  private async handleFailure(item: QueueItem, error: string) {
    item.retries++;
    if (item.retries >= this.maxRetries) {
      await query(
        `UPDATE messages SET status = ?, error_message = ?, updated_at = NOW() WHERE id = ?`,
        [MessageStatus.FAILED, error, item.messageId],
      );
      await query(`UPDATE message_queue SET status = 'FAILED' WHERE id = ?`, [
        item.id,
      ]);
      await this.removeFromQueue(item.id);
    } else {
      item.scheduledAt = new Date(Date.now() + this.retryDelay * item.retries);
      await query(
        `UPDATE messages SET status = ?, retry_count = ?, error_message = ?, updated_at = NOW() WHERE id = ?`,
        [MessageStatus.QUEUED, item.retries, error, item.messageId],
      );
      await query(
        `UPDATE message_queue SET status = 'PENDING', scheduled_at = ? WHERE id = ?`,
        [item.scheduledAt, item.id],
      );
    }
  }

  private async removeFromQueue(queueId: string) {
    this.queue = this.queue.filter((item) => item.id !== queueId);
  }

  getStatus() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      pendingMessages: this.queue.filter((i) => i.scheduledAt <= new Date())
        .length,
    };
  }
}

export const messageQueue = globalForQueue.messageQueue || new MessageQueue();

if (process.env.NODE_ENV !== "production") {
  globalForQueue.messageQueue = messageQueue;
}

if (globalForQueue.messageQueue === undefined) {
  messageQueue.loadPendingMessages();
}
```

### Path: src/lib/api-middlewares/cors.ts

```typescript
import { NextResponse } from "next/server";

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
  };
}

export function handleCors() {
  return NextResponse.json({}, { headers: corsHeaders() });
}
```

### Path: src/lib/api-middlewares/with-auth.ts

```typescript
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import { UserRole } from "@/types/database.types";

type RouteHandler = (req: NextRequest, context?: any) => Promise<Response>;

interface AuthOptions {
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
}

export function withAuth(handler: RouteHandler, options?: AuthOptions) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return unauthorizedResponse();
      }

      if (options?.requiredRole && session.user.role !== options.requiredRole) {
        return forbiddenResponse("Insufficient permissions");
      }

      if (
        options?.allowedRoles &&
        !options.allowedRoles.includes(session.user.role as UserRole)
      ) {
        return forbiddenResponse("Insufficient permissions");
      }

      return handler(req, context);
    } catch (error) {
      if (error instanceof Error) {
        return serverErrorResponse(error);
      }
      return serverErrorResponse(new Error("Unknown error in auth middleware"));
    }
  };
}
```

### Path: src/lib/api-middlewares/with-rate-limit.ts

```typescript
import { NextRequest } from "next/server";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import {
  rateLimitResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

type RouteHandler = (req: NextRequest, context?: any) => Promise<Response>;

export function withRateLimit(handler: RouteHandler) {
  return async (req: NextRequest, context?: any) => {
    try {
      // Basic rate limit check based on API Key if present
      const apiKey = req.headers.get("x-api-key");
      if (apiKey) {
        // Future implementation: Check rate limit per API key
        // const allowed = await RateLimiter.checkApiKeyLimit(apiKey);
        // if (!allowed) return rateLimitResponse();
      }

      return handler(req, context);
    } catch (error) {
      if (error instanceof Error) {
        return serverErrorResponse(error);
      }
      return serverErrorResponse(new Error("Unknown error in middleware"));
    }
  };
}
```

### Path: src/lib/docs/openapi.json

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "WhatsApp Dashboard API",
    "version": "1.0.0",
    "description": "REST API documentation for WhatsApp Dashboard Multi-Device. Manage devices, send messages, and sync contacts."
  },
  "servers": [
    {
      "url": "http://localhost:3000/api",
      "description": "Local Development Server"
    }
  ],
  "components": {
    "securitySchemes": {
      "ApiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key"
      }
    }
  },
  "paths": {
    "/messages/send": {
      "post": {
        "summary": "Send a message",
        "security": [{ "ApiKeyAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "deviceId": {
                    "type": "string",
                    "format": "uuid",
                    "description": "ID of the sending device"
                  },
                  "toNumber": {
                    "type": "string",
                    "description": "Target phone number (e.g. 62812345678)"
                  },
                  "message": {
                    "type": "string",
                    "description": "Text message content"
                  }
                },
                "required": ["deviceId", "toNumber", "message"]
              }
            },
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "deviceId": { "type": "string", "format": "uuid" },
                  "toNumber": { "type": "string" },
                  "message": { "type": "string" },
                  "media": { "type": "string", "format": "binary" }
                },
                "required": ["deviceId", "toNumber"]
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Message queued successfully" },
          "401": { "description": "Unauthorized" },
          "422": { "description": "Validation Error" }
        }
      }
    },
    "/devices": {
      "get": {
        "summary": "List all devices",
        "security": [{ "ApiKeyAuth": [] }],
        "responses": {
          "200": { "description": "List of devices" }
        }
      }
    },
    "/contacts": {
      "get": {
        "summary": "List contacts",
        "security": [{ "ApiKeyAuth": [] }],
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "schema": { "type": "integer", "default": 1 }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": { "type": "integer", "default": 20 }
          }
        ],
        "responses": { "200": { "description": "Paginated contacts list" } }
      }
    }
  }
}
```

### Path: src/config/app.config.ts

```typescript
import { z } from "zod";

const envSchema = z.object({
  MARIADB_HOST: z.string().default("localhost"),
  MARIADB_PORT: z.string().default("3306"),
  MARIADB_USER: z.string().default("root"),
  MARIADB_PASSWORD: z.string().optional().default(""),
  MARIADB_DATABASE: z.string().default("whatsapp_db"),

  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  WHATSAPP_SESSION_PATH: z.string().default("./sessions"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  RATE_LIMIT_PER_MINUTE: z.string().default("20"),
  RATE_LIMIT_PER_HOUR: z.string().default("500"),

  CRON_SECRET: z.string().min(8).default("change_this_secret_in_prod"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  if (typeof window !== "undefined") return process.env as unknown as Env;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  ${field}: ${messages?.join(", ")}`)
      .join("\n");

    console.error("\n=== ENVIRONMENT VALIDATION FAILED ===");
    console.error("Missing or invalid environment variables:\n");
    console.error(errorMessages);
    console.error("\n=== REQUIRED VARIABLES ===");
    console.error("- NEXTAUTH_URL (must be valid URL)");
    console.error("- NEXTAUTH_SECRET (min 32 characters)");
    console.error("- GOOGLE_CLIENT_ID");
    console.error("- GOOGLE_CLIENT_SECRET");
    console.error("- MARIADB_HOST");
    console.error("- MARIADB_DATABASE");
    console.error(
      "\nPlease check your .env file and ensure all required variables are set correctly.\n",
    );

    throw new Error(
      "Environment validation failed. Check console output above.",
    );
  }

  return parsed.data;
}

export const env = validateEnv();

export const appConfig = {
  database: {
    host: env.MARIADB_HOST,
    port: parseInt(env.MARIADB_PORT),
    user: env.MARIADB_USER,
    password: env.MARIADB_PASSWORD,
    database: env.MARIADB_DATABASE,
  },
  auth: {
    url: env.NEXTAUTH_URL,
    secret: env.NEXTAUTH_SECRET,
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  whatsapp: {
    sessionPath: env.WHATSAPP_SESSION_PATH,
  },
  rateLimit: {
    perMinute: parseInt(env.RATE_LIMIT_PER_MINUTE),
    perHour: parseInt(env.RATE_LIMIT_PER_HOUR),
  },
  cronSecret: env.CRON_SECRET,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
} as const;
```

### Path: src/config/database.config.ts

```typescript
// src/config/database.config.ts
import { appConfig } from "./app.config";

export const databaseConfig = {
  host: appConfig.database.host,
  port: appConfig.database.port,
  user: appConfig.database.user,
  password: appConfig.database.password,
  database: appConfig.database.database,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: "+00:00",
  multipleStatements: false,
  namedPlaceholders: true,
};
```

### Path: src/middleware.ts

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Bisa tambahkan logic custom di sini, misal cek role user
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Return true jika token ada (login)
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/devices/:path*",
    "/messages/:path*",
    "/contacts/:path*",
    "/settings/:path*",
    // Lindungi API routes kecuali public ones
    "/api/devices/:path*",
    "/api/messages/:path*",
  ],
};
```

### Path: src/types/api.types.ts

```typescript
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
```

### Path: src/types/database.types.ts

```typescript
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
```

### Path: src/types/index.ts

```typescript
// src/types/index.ts
export * from "./api.types";
export * from "./database.types";
```

### Path: src/types/next-auth.d.ts

```typescript
// src/types/next-auth.d.ts
import { UserRole } from "./database.types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      mfaEnabled: boolean;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    mfaEnabled: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    mfaEnabled: boolean;
  }
}
```

### Path: src/types/vcf.d.ts

```typescript
// src/types/vcf.d.ts
declare module "vcf";
```

### Path: database/schema.sql

```sql
CREATE DATABASE IF NOT EXISTS whatsapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE whatsapp_db;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'USER_A', 'USER_B', 'USER_C', 'DST') NOT NULL DEFAULT 'USER_A',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  status ENUM('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'QR_READY', 'AUTHENTICATED', 'ERROR') NOT NULL DEFAULT 'DISCONNECTED',
  is_ready BOOLEAN DEFAULT FALSE,
  user_id VARCHAR(36) NOT NULL,
  session_data TEXT,
  last_seen TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_phone_number (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  tags JSON,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_phone_user (phone_number, user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_phone_number (phone_number),
  FULLTEXT idx_name_search (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  device_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  from_number VARCHAR(20),
  to_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  media_url VARCHAR(255),
  media_type ENUM('image', 'video', 'audio', 'document') DEFAULT NULL,
  caption TEXT,
  direction ENUM('INBOUND', 'OUTBOUND') NOT NULL DEFAULT 'OUTBOUND',
  status ENUM('PENDING', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'PENDING',
  retry_count INT DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_device_user (device_id, user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_numbers (from_number, to_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS message_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  variables JSON,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auto_response_rules (
  id VARCHAR(36) PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  response TEXT NOT NULL,
  match_type ENUM('EXACT', 'CONTAINS', 'AI') NOT NULL DEFAULT 'EXACT',
  device_id VARCHAR(36) NOT NULL,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_keyword (device_id, keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(36) PRIMARY KEY,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_key_hash (key_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS message_queue (
  id VARCHAR(36) PRIMARY KEY,
  message_id VARCHAR(36) NOT NULL,
  device_id VARCHAR(36) NOT NULL,
  priority INT DEFAULT 0,
  scheduled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_status_schedule (status, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhooks (
  id VARCHAR(36) PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  events JSON NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  secret VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  setting_key VARCHAR(255) NOT NULL,
  setting_value JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_key (user_id, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(36),
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_messages_device_status_created
  ON messages(device_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_message_queue_priority_status
  ON message_queue(priority DESC, status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_messages_user_created
  ON messages(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_devices_user_status
  ON devices(user_id, status, is_ready);

CREATE INDEX IF NOT EXISTS idx_contacts_user_phone
  ON contacts(user_id, phone_number);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_active
  ON api_keys(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON audit_logs(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_active
  ON webhooks(user_id, is_active);
```
