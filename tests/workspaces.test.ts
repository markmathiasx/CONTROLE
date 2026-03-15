import { describe, expect, it } from "vitest";

import { buildWorkspaceSlug, getWorkspaceKindLabel } from "@/utils/workspaces";

describe("workspace helpers", () => {
  it("gera slug legivel e estavel com sufixo controlado", () => {
    expect(buildWorkspaceSlug("Casa & Casal", "abc12345")).toBe("casa-casal-abc12345");
  });

  it("resolve o rotulo do tipo de workspace", () => {
    expect(getWorkspaceKindLabel(true)).toBe("Pessoal");
    expect(getWorkspaceKindLabel(false)).toBe("Compartilhado");
    expect(getWorkspaceKindLabel(null)).toBe("Compartilhado");
  });
});
