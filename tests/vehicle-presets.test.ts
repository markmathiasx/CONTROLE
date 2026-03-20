import { describe, expect, it } from "vitest";

import {
  findVehiclePreset,
  getVehicleMaintenanceReferences,
  vehiclePresetOptions,
} from "@/lib/constants";

describe("vehicle presets", () => {
  it("lista presets populares de carros e motos com anos 2016+", () => {
    const carPresets = vehiclePresetOptions.filter((item) => item.vehicleType === "car");
    const motorcyclePresets = vehiclePresetOptions.filter((item) => item.vehicleType === "motorcycle");

    expect(carPresets.length).toBeGreaterThanOrEqual(18);
    expect(motorcyclePresets.length).toBeGreaterThanOrEqual(8);
    expect(
      vehiclePresetOptions.some(
        (item) => item.vehicleType === "car" && item.years.some((year) => year >= 2016),
      ),
    ).toBe(true);
  });

  it("encontra preset por marca/modelo/ano", () => {
    const preset = findVehiclePreset("Volkswagen", "Polo 1.0 TSI", 2022);
    expect(preset?.id).toBe("polo-1-0-tsi");
  });

  it("retorna referências de manutenção com peças e custo estimado", () => {
    const references = getVehicleMaintenanceReferences({ vehicleType: "car" });
    expect(references.length).toBeGreaterThanOrEqual(6);
    expect(references[0]?.typicalParts.length).toBeGreaterThan(0);
    expect(references[0]?.estimatedCostMax).toBeGreaterThan(references[0]?.estimatedCostMin ?? 0);
  });
});

