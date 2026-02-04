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
