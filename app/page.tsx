import { redirect } from "next/navigation";

import { PublicLanding } from "@/features/auth/public-landing";
import { HubPage } from "@/features/hub/hub-page";
import { getRuntimeConfig } from "@/lib/env";
import { getSupabaseServerClient } from "@/services/supabase/server";

export default async function HomePage() {
  const runtimeConfig = getRuntimeConfig();

  if (!runtimeConfig.hasSupabase) {
    return <HubPage />;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return <PublicLanding />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <HubPage />;
}
