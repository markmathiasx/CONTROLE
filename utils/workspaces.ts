import { slugify } from "@/lib/utils";

export function buildWorkspaceSlug(name: string, suffix = Date.now().toString(36)) {
  const base = slugify(name.trim() || "workspace");
  const shortSuffix = suffix.replace(/[^a-z0-9]+/gi, "").toLowerCase().slice(-8) || "workspace";
  return `${base}-${shortSuffix}`;
}

export function getWorkspaceKindLabel(isPersonal?: boolean | null) {
  return isPersonal ? "Pessoal" : "Compartilhado";
}
