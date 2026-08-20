import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const successResponse = NextResponse.redirect(new URL("/dashboard", requestUrl.origin));

    if (!url || !publishableKey) {
      return NextResponse.redirect(new URL("/login?error=CONFIRMATION_INVALID", requestUrl.origin));
    }

    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, options, value }) => {
            successResponse.cookies.set(name, value, options);
          });
        },
      },
    });
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (!error) {
      return successResponse;
    }
  }

  return NextResponse.redirect(new URL("/login?error=CONFIRMATION_INVALID", requestUrl.origin));
}
