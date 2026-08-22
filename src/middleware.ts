import type { NextRequest } from "next/server";

import { refreshSupabaseSession } from "@/lib/supabase/middleware";
import { requestIdFromHeaders } from "@/lib/observability";

export async function middleware(request: NextRequest) {
  const requestId = requestIdFromHeaders(request.headers);
  request.headers.set("x-request-id", requestId);
  const response = await refreshSupabaseSession(request);
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
