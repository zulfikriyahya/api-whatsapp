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
