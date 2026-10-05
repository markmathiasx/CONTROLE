import { describe, it, expect } from "vitest";
import {
  debtSummary,
  parseMoney,
  csvCell,
  canEdit,
  HouseSettings,
  HousePayment,
  BlueUser,
} from "@/lib/blue/domain";
const cfg: HouseSettings = {
  total_cents: 8000000,
  installment_cents: 150000,
  opening_paid_cents: 300000,
  opening_installments: 2,
  due_day: 10,
};
const payment = (amount: number, date = "2026-10-05"): HousePayment => ({
  id: "1",
  amount_cents: amount,
  date,
  user_id: "mark",
  note: "",
});
describe("Controle Blue debt contract", () => {
  it("counts the smaller final payment, rather than losing R$500", () => {
    const s = debtSummary(cfg, [], "2026-10-05");
    expect(s.remaining).toBe(7700000);
    expect(s.paid).toBe(300000);
    expect(s.remainingInstallments).toBe(52);
    expect(s.lastInstallment).toBe(50000);
    expect(s.paidInstallments).toBe(2);
    expect(s.payoff).toBe("janeiro de 2031");
  });
  it("moves the schedule when the current due date has passed", () => {
    expect(debtSummary(cfg, [], "2026-10-11").payoff).toBe("fevereiro de 2031");
  });
  it("accounts for an early extra payment and flags the last twelve payments", () => {
    const s = debtSummary(cfg, [payment(6000000)], "2026-10-05");
    expect(s.remaining).toBe(1700000);
    expect(s.remainingInstallments).toBe(12);
    expect(s.nearPayoff).toBe(true);
    expect(s.payoff).toBe("outubro de 2027");
  });
  it("handles exact payoff and variable monthly payments", () => {
    const s = debtSummary(cfg, [payment(7700000)], "2026-10-05");
    expect(s.payoff).toBe("Quitada");
    expect(s.remainingInstallments).toBe(0);
    expect(s.progress).toBe(100);
    expect(s.lastInstallment).toBe(0);
  });
  it("parses Brazilian values into integer cents", () => {
    expect(parseMoney("1.500,00")).toBe(150000);
    expect(parseMoney("1500.50")).toBe(150050);
    expect(parseMoney("0,01")).toBe(1);
    expect(() => parseMoney("-1")).toThrow();
    expect(() => parseMoney("1.001")).toThrow();
  });
  it("neutralizes spreadsheet formulas in CSV descriptions", () => {
    expect(csvCell('=HYPERLINK("a")')).toBe('"\'=HYPERLINK(""a"")"');
  });
  it("never lets the collaborator edit another user entry", () => {
    const u = { id: "a", role: "user" } as BlueUser;
    expect(canEdit(u, "b")).toBe(false);
    expect(canEdit(u, "a")).toBe(true);
    expect(canEdit({ ...u, role: "viewer" }, "a")).toBe(false);
  });
});
