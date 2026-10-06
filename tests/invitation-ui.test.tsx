import { StrictMode } from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Login } from "@/components/blue/login";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});
describe("individual first access", () => {
  it("lets an unauthenticated user paste the full invitation and selects its recipient", () => {
    render(<Login configured setup />);
    const input = screen.getByLabelText(
      "Convite individual de primeiro acesso",
    );
    fireEvent.change(input, {
      target: {
        value:
          "https://controle-blue.vercel.app/auth/setup-password#user=andressa&activation=" +
          "a".repeat(64),
      },
    });
    expect(screen.getByLabelText("Usuário")).toHaveValue("andressa");
    expect(screen.getByLabelText("Usuário")).toBeDisabled();
    expect(input).toHaveValue("a".repeat(64));
  });
  it("keeps the token and recipient through strict-mode effects while scrubbing browser history", () => {
    window.history.replaceState(
      null,
      "",
      "/auth/setup-password#user=sidney&activation=" + "b".repeat(64),
    );
    render(
      <StrictMode>
        <Login configured setup />
      </StrictMode>,
    );
    expect(screen.getByLabelText("Usuário")).toHaveValue("sidney");
    expect(
      screen.getByLabelText("Convite individual de primeiro acesso"),
    ).toHaveValue("b".repeat(64));
    expect(window.location.hash).toBe("");
  });
});
