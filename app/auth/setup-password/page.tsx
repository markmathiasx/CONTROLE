import { Login } from "@/components/blue/login";
import { rpc } from "@/lib/blue/server";
export const dynamic = "force-dynamic";
export default async function Page() {
  let initialUser = "mark";
  try {
    const session = await rpc("session");
    if (session.ok) initialUser = session.username;
  } catch {}
  return (
    <Login
      setup
      initialUser={initialUser}
      configured={
        !!(
          process.env.BLUE_SUPABASE_URL &&
          process.env.BLUE_SUPABASE_SERVICE_ROLE_KEY
        )
      }
    />
  );
}
