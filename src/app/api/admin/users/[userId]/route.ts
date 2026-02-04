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
