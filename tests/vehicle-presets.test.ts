import { describe, expect, it } from "vitest";

import {
  estimateVehiclePresetCostProfile,
  findVehiclePreset,
  getVehicleCatalogPresetOptions,
  getVehicleMaintenanceReferences,
  getVehiclePresetBrandOptions,
  getVehiclePresetOptions,
  vehiclePresetOptions,
} from "@/lib/constants";

describe("vehicle presets", () => {
  it("lista presets populares de carros e motos com anos amplos", () => {
    const carPresets = vehiclePresetOptions.filter((item) => item.vehicleType === "car");
    const motorcyclePresets = vehiclePresetOptions.filter((item) => item.vehicleType === "motorcycle");

    expect(carPresets.length).toBeGreaterThanOrEqual(1000);
    expect(motorcyclePresets.length).toBeGreaterThanOrEqual(1000);
    expect(
      vehiclePresetOptions.some(
        (item) => item.vehicleType === "car" && item.years.some((year) => year >= 1998),
      ),
    ).toBe(true);
  });

  it("cobre anos de 1998 a 2026 para carros e motos no catálogo", () => {
    for (let year = 1998; year <= 2026; year += 1) {
      expect(
        vehiclePresetOptions.some((item) => item.vehicleType === "car" && item.years.includes(year)),
      ).toBe(true);
      expect(
        vehiclePresetOptions.some(
          (item) => item.vehicleType === "motorcycle" && item.years.includes(year),
        ),
      ).toBe(true);
    }
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

  it("inclui cobertura ampliada de veículos populares nacionais e importados", () => {
    expect(findVehiclePreset("Chevrolet", "Celta 1.0", 2000)?.id).toBe("br-chevrolet-celta-1-0");
    expect(findVehiclePreset("Chevrolet", "Celta 1.0", 2016)?.id).toBe("br-chevrolet-celta-1-0");
    expect(findVehiclePreset("Chevrolet", "Prisma 1.4", 2018)?.id).toBe("br-chevrolet-prisma-1-4");
    expect(findVehiclePreset("Volkswagen", "Amarok V6 3.0 Diesel", 2025)?.id).toBe(
      "br-volkswagen-amarok-v6-3-0-diesel",
    );
    expect(findVehiclePreset("Honda", "CB 500F", 2022)?.id).toBe("br-honda-cb-500f");
    expect(findVehiclePreset("Triumph", "Speed 400", 2025)?.id).toBe("br-triumph-speed-400");
    expect(findVehiclePreset("Honda", "CG 125 Titan", 1999)?.id).toBe("br-honda-cg-125-titan");
  });

  it("inclui motos de alta cilindrada e modelos esportivos pedidos", () => {
    expect(findVehiclePreset("Honda", "CB 600F Hornet", 2012)?.id).toBe(
      "br-honda-cb-600f-hornet",
    );
    expect(findVehiclePreset("Suzuki", "GSX1300R Hayabusa", 2024)?.id).toBe(
      "br-suzuki-gsx1300r-hayabusa",
    );
    expect(findVehiclePreset("BMW", "S 1000 XR", 2024)?.id).toBe("br-bmw-s-1000-xr");
    expect(findVehiclePreset("Kawasaki", "Ninja ZX-10R", 2025)?.id).toBe(
      "br-kawasaki-ninja-zx-10r",
    );
  });

  it("expõe catálogo familiar sem esconder modelos legados por padrão", () => {
    const familyCatalog = getVehicleCatalogPresetOptions({ vehicleType: "all", year: "all" });
    const brands = getVehiclePresetBrandOptions({ vehicleType: "all", year: "all", catalogOnly: true });

    expect(familyCatalog.some((item) => item.id === "br-chevrolet-celta-1-0")).toBe(true);
    expect(familyCatalog.some((item) => item.id === "br-honda-cg-125-titan")).toBe(true);
    expect(familyCatalog.some((item) => item.brand === "Harley-Davidson")).toBe(true);
    expect(brands).toContain("Chevrolet");
    expect(brands).toContain("Honda");
    expect(brands).toContain("Harley-Davidson");
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
