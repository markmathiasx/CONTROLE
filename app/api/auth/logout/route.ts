import { NextResponse } from "next/server";

import { enforceSameOrigin, jsonNoStore } from "@/lib/server-security";
import { getSupabaseRouteHandlerClient } from "@/services/supabase/server";

export async function POST(request: Request) {
  const blockedOrigin = enforceSameOrigin(request);
  if (blockedOrigin) {
    return blockedOrigin;
  }

  const response = NextResponse.json({ ok: true });
  const supabase = await getSupabaseRouteHandlerClient(response);
  if (!supabase) {
    return jsonNoStore({ ok: true });
  }

  await supabase.auth.signOut();
  return jsonNoStore({ ok: true }, { headers: response.headers });
}
