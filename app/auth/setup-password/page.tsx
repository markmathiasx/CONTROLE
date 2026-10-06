import { Login } from "@/components/blue/login";
import { rpc } from "@/lib/blue/server";
export const dynamic = "force-dynamic";
export default async function Page() {
  let initialUser = "mark";
  let hasSetupSession = false;
  try {
    const session = await rpc("session");
    if (session.ok && session.first_login) { initialUser = session.username; hasSetupSession = true; }
  } catch {}
  return (
    <Login
      setup
      initialUser={initialUser}
      hasSetupSession={hasSetupSession}
      configured={
        !!(
          process.env.BLUE_SUPABASE_URL &&
          process.env.BLUE_SUPABASE_SERVICE_ROLE_KEY
        )
      }
    />
  );
}
