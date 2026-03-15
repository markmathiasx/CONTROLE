import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getSupabasePublicEnv } from "@/lib/env";

export async function getSupabaseServerClient() {
  const config = getSupabasePublicEnv();
  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components may not be allowed to mutate cookies. Middleware/route handlers handle refresh.
        }
      },
    },
  });
}

export async function getSupabaseRouteHandlerClient(response: NextResponse) {
  const config = getSupabasePublicEnv();
  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
