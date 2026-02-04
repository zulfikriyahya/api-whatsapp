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
