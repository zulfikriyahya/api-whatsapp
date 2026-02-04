import { NextResponse } from "next/server";
import swaggerSpec from "@/lib/docs/openapi.json";

export async function GET() {
  return NextResponse.json(swaggerSpec);
}
