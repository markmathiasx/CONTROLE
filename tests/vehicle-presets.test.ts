import { describe, expect, it } from "vitest";

import {
  estimateVehiclePresetCostProfile,
  findVehiclePreset,
  getVehicleMaintenanceReferences,
  getVehiclePresetOptions,
  vehiclePresetOptions,
} from "@/lib/constants";

describe("vehicle presets", () => {
  it("lista presets populares de carros e motos com anos 2016+", () => {
    const carPresets = vehiclePresetOptions.filter((item) => item.vehicleType === "car");
    const motorcyclePresets = vehiclePresetOptions.filter((item) => item.vehicleType === "motorcycle");

    expect(carPresets.length).toBeGreaterThanOrEqual(1000);
    expect(motorcyclePresets.length).toBeGreaterThanOrEqual(1000);
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

  it("traz presets solicitados no contexto real (CG 160, Prisma 1.0 e Gol 1.5)", () => {
    expect(findVehiclePreset("Honda", "CG 160", 2024)?.id).toBe("cg-160");
    expect(findVehiclePreset("Chevrolet", "Prisma 1.0", 2015)?.id).toBe("prisma-1-0-2015");
    expect(findVehiclePreset("Volkswagen", "Gol 1.5", 2016)?.id).toBe("gol-1-5-2016");
    expect(findVehiclePreset("BMW", "G 310 GS", 2024)?.id).toBe("bmw-g310gs");
  });

  it("retorna referências de manutenção com peças e custo estimado", () => {
    const references = getVehicleMaintenanceReferences({ vehicleType: "car" });
    expect(references.length).toBeGreaterThanOrEqual(6);
    expect(references[0]?.typicalParts.length).toBeGreaterThan(0);
    expect(references[0]?.estimatedCostMax).toBeGreaterThan(references[0]?.estimatedCostMin ?? 0);
  });

  it("filtra presets por ano/tipo e estima custo por km de referência", () => {
    const presets2026Cars = getVehiclePresetOptions({ vehicleType: "car", year: 2026 });
    expect(presets2026Cars.length).toBeGreaterThan(0);
    expect(presets2026Cars.every((item) => item.vehicleType === "car" && item.years.includes(2026))).toBe(true);

    const costProfile = estimateVehiclePresetCostProfile(presets2026Cars[0], {
      annualKm: 12000,
      fuelPricePerLiter: 6.2,
    });

    expect(costProfile.totalCostPerKm).toBeGreaterThan(0);
    expect(costProfile.annualMaintenanceCost).toBeGreaterThan(0);
  });
});
