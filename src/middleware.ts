// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(_req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/devices/:path*",
    "/messages/:path*",
    "/api/devices/:path*",
    "/api/messages/:path*",
    "/api/contacts/:path*",
    "/api/templates/:path*",
    "/api/auto-response/:path*",
    "/api/backup/:path*",
    "/api/webhooks/:path*",
    "/api/api-keys/:path*",
    "/api/stats/:path*",
  ],
};
