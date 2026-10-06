import { redirect } from "next/navigation";
import { rpc } from "./server";
import { BlueApp } from "@/components/blue/app";
export async function BluePage({
  tab,
}: {
  tab: "dashboard" | "gastos" | "casa" | "configuracoes" | "relatorios";
}) {
  let data;
  try {
    data = await rpc("data");
  } catch {
    redirect("/login");
  }
  if (!data.ok) redirect("/login");
  if (data.user.role === "viewer" && tab !== "casa") redirect("/casa");
  if (tab === "configuracoes" && data.user.username !== "mark") redirect("/");
  return <BlueApp initial={data} tab={tab} />;
}
