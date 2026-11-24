import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cookieName, previewHeader, supabaseConfig } from "@/lib/cms/config";

export async function proxy(request: NextRequest) {
  const config = supabaseConfig();
  const headers = new Headers(request.headers);
  headers.delete(previewHeader);
  let response = NextResponse.next({ request: { headers } });
  if (
    !config ||
    !request.cookies
      .getAll()
      .some(
        ({ name }) => name === cookieName || name.startsWith(cookieName + "."),
      )
  )
    return response;
  const preview = request.nextUrl.searchParams.get("cms-preview");
  if (
    preview &&
    preview.length <= 180 &&
    /^\/[a-z0-9/~.-]*$/.test(preview) &&
    preview.split("~")[0] === request.nextUrl.pathname
  ) {
    headers.set(previewHeader, preview);
  }
  response = NextResponse.next({ request: { headers } });
  const client = createServerClient(config.url, config.key, {
    cookieOptions: {
      name: cookieName,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        const cookie = request.headers.get("cookie");
        if (cookie) headers.set("cookie", cookie);
        else headers.delete("cookie");
        response = NextResponse.next({ request: { headers } });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await client.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images/|robots.txt|sitemap.xml|icon.svg).*)",
  ],
};
