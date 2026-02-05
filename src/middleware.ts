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
