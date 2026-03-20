import type {
  Category,
  CostCenterKind,
  IncomeType,
  MaintenanceCategory,
  PaymentMethod,
  StoreOrderStatus,
  SupplyUnit,
  ThemeMode,
  VehicleFixedCostKind,
  VehicleType,
} from "@/types/domain";

export const appName = "Controle Financeiro MMSVH";
export const schemaVersion = 3;
export const appVersion = "0.3.0";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  vr: "VR",
};

export const costCenterKindLabels: Record<CostCenterKind, string> = {
  me: "Eu",
  partner: "Namorada",
  shared: "Casal",
  moto: "Automóvel",
  store: "Loja",
};

export const vehicleTypeLabels: Record<VehicleType, string> = {
  motorcycle: "Moto",
  car: "Carro",
};

export const vehicleFixedCostLabels: Record<VehicleFixedCostKind, string> = {
  ipva: "IPVA",
  insurance: "Seguro",
  licensing: "Licenciamento",
};

export const incomeTypeLabels: Record<IncomeType, string> = {
  salary: "Salário",
  vr: "VR",
  freelance: "Extra/Freela",
  reimbursement: "Reembolso",
  sale: "Venda",
  other: "Outros",
};

export const themeLabels: Record<ThemeMode, string> = {
  dark: "Escuro",
  light: "Claro",
  system: "Sistema",
};

export const maintenanceCategoryLabels: Record<MaintenanceCategory, string> = {
  "troca-de-oleo": "Troca de óleo",
  "filtro-de-oleo": "Filtro de óleo",
  "filtro-de-ar": "Filtro de ar",
  relacao: "Relação",
  pneu: "Pneu",
  freio: "Freio",
  embreagem: "Embreagem",
  bateria: "Bateria",
  eletrica: "Elétrica",
  revisao: "Revisão",
  documentacao: "Documentação",
  lavagem: "Lavagem",
  outros: "Outros",
};

export const storeOrderStatusLabels: Record<StoreOrderStatus, string> = {
  budget: "Orçamento",
  "in-production": "Em produção",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const supplyUnitLabels: Record<SupplyUnit, string> = {
  g: "g",
  ml: "ml",
  l: "L",
  unit: "un",
  sheet: "folha",
  m: "m",
};

export const categoryPresets: Array<
  Pick<
    Category,
    "name" | "color" | "icon" | "keywords" | "budgetable" | "scope"
  >
> = [
  {
    name: "Cigarro",
    color: "#f97316",
    icon: "cigarette",
    keywords: ["cigarro", "tabaco", "marlboro"],
    budgetable: true,
    scope: "finance",
  },
  {
    name: "Ervas",
    color: "#22c55e",
    icon: "leaf",
    keywords: ["erva", "ervas", "beck", "verde"],
    budgetable: true,
    scope: "finance",
  },
  {
    name: "Bebidas",
    color: "#06b6d4",
    icon: "wine",
    keywords: ["bebida", "bebidas", "cerveja", "drink"],
    budgetable: true,
    scope: "finance",
  },
  {
    name: "Alimentação",
    color: "#10b981",
    icon: "utensils",
    keywords: ["almoco", "almoço", "janta", "lanche", "ifood"],
    budgetable: true,
    scope: "finance",
  },
  {
    name: "Mercado",
    color: "#84cc16",
    icon: "shopping-cart",
    keywords: ["mercado", "supermercado", "compra"],
    budgetable: true,
    scope: "shared",
  },
  {
    name: "Transporte",
    color: "#38bdf8",
    icon: "car",
    keywords: ["uber", "onibus", "ônibus", "metro", "transporte"],
    budgetable: true,
    scope: "finance",
  },
  {
    name: "Contas",
    color: "#8b5cf6",
    icon: "receipt",
    keywords: ["conta", "luz", "agua", "água", "internet"],
    budgetable: false,
    scope: "shared",
  },
  {
    name: "Aluguel",
    color: "#a855f7",
    icon: "home",
    keywords: ["aluguel", "moradia"],
    budgetable: false,
    scope: "shared",
  },
  {
    name: "Farmácia",
    color: "#ef4444",
    icon: "pill",
    keywords: ["farmacia", "farmácia", "remedio", "remédio"],
    budgetable: true,
    scope: "finance",
  },
  {
    name: "Lazer",
    color: "#ec4899",
    icon: "sparkles",
    keywords: ["lazer", "cinema", "show", "role", "rolê"],
    budgetable: true,
    scope: "finance",
  },
  {
    name: "Assinatura",
    color: "#64748b",
    icon: "badge-dollar-sign",
    keywords: ["assinatura", "netflix", "spotify"],
    budgetable: false,
    scope: "shared",
  },
  {
    name: "Presente",
    color: "#fb7185",
    icon: "gift",
    keywords: ["presente", "lembranca", "lembrança"],
    budgetable: true,
    scope: "finance",
  },
  {
    name: "Pets",
    color: "#f59e0b",
    icon: "paw-print",
    keywords: ["pet", "pets", "racao", "ração"],
    budgetable: true,
    scope: "shared",
  },
  {
    name: "Saúde",
    color: "#14b8a6",
    icon: "heart-pulse",
    keywords: ["saude", "saúde", "medico", "médico", "exame"],
    budgetable: true,
    scope: "finance",
  },
  {
    name: "Outros",
    color: "#64748b",
    icon: "circle-ellipsis",
    keywords: ["outros", "diverso", "diversos"],
    budgetable: true,
    scope: "shared",
  },
  {
    name: "Combustível",
    color: "#f59e0b",
    icon: "fuel",
    keywords: ["gasolina", "combustivel", "combustível", "abastecimento", "posto"],
    budgetable: false,
    scope: "moto",
  },
  {
    name: "Manutenção Moto",
    color: "#38bdf8",
    icon: "wrench",
    keywords: ["oleo", "óleo", "manutencao", "manutenção", "oficina", "moto"],
    budgetable: false,
    scope: "moto",
  },
  {
    name: "Documentação Moto",
    color: "#60a5fa",
    icon: "file-text",
    keywords: ["ipva", "seguro", "documentacao", "documentação"],
    budgetable: false,
    scope: "moto",
  },
  {
    name: "Filamento",
    color: "#facc15",
    icon: "package-2",
    keywords: ["filamento", "pla", "petg", "spool", "rolo"],
    budgetable: false,
    scope: "store",
  },
  {
    name: "Pintura e Acabamento",
    color: "#fb7185",
    icon: "paintbrush",
    keywords: ["tinta", "primer", "verniz", "acabamento", "pintura"],
    budgetable: false,
    scope: "store",
  },
  {
    name: "Energia Loja",
    color: "#22d3ee",
    icon: "zap",
    keywords: ["energia", "luz", "kwh", "eletricidade"],
    budgetable: false,
    scope: "store",
  },
  {
    name: "Embalagem",
    color: "#c084fc",
    icon: "package",
    keywords: ["embalagem", "caixa", "sacola", "etiqueta"],
    budgetable: false,
    scope: "store",
  },
  {
    name: "Venda Loja",
    color: "#34d399",
    icon: "store",
    keywords: ["venda", "pedido", "cliente", "produto"],
    budgetable: false,
    scope: "store",
  },
];

export const filamentMaterialOptions = ["PLA", "PETG", "ABS", "TPU", "Outro"] as const;

export interface VehicleMaintenanceReference {
  id: string;
  label: string;
  category: MaintenanceCategory;
  recommendedKmInterval?: number;
  recommendedMonthsInterval?: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  typicalParts: string[];
}

export interface VehiclePresetOption {
  id: string;
  label: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  engineLabel?: string;
  segment?: string;
  fuelType: string;
  averageCityKmPerLiter: number;
  averageHighwayKmPerLiter: number;
  tankCapacityLiters: number;
  fixedCosts: {
    ipva: { enabled: boolean; amount: number; dueMonth: number; dueDay: number };
    insurance: { enabled: boolean; amount: number; dueMonth: number; dueDay: number };
    licensing: { enabled: boolean; amount: number; dueMonth: number; dueDay: number };
  };
  years: number[];
}

export interface VehiclePresetCostProfile {
  presetId: string;
  annualKm: number;
  fuelPricePerLiter: number;
  annualFuelCost: number;
  annualMaintenanceCost: number;
  annualFixedCost: number;
  annualTotalCost: number;
  fuelCostPerKm: number;
  maintenanceCostPerKm: number;
  fixedCostPerKm: number;
  totalCostPerKm: number;
}

function yearRange(start: number, end = new Date().getFullYear()) {
  const normalizedEnd = Math.max(start, end);
  return Array.from({ length: normalizedEnd - start + 1 }, (_, index) => start + index);
}

function buildFixedCosts(ipva: number, insurance: number, licensing = 180) {
  return {
    ipva: { enabled: true, amount: ipva, dueMonth: 1, dueDay: 25 },
    insurance: { enabled: true, amount: insurance, dueMonth: 6, dueDay: 10 },
    licensing: { enabled: true, amount: licensing, dueMonth: 9, dueDay: 15 },
  };
}

const motorcycleMaintenanceReferences: VehicleMaintenanceReference[] = [
  {
    id: "moto-oleo",
    label: "Troca de óleo",
    category: "troca-de-oleo",
    recommendedKmInterval: 2500,
    recommendedMonthsInterval: 4,
    estimatedCostMin: 55,
    estimatedCostMax: 130,
    typicalParts: ["Óleo 10W-30", "Anel do bujão"],
  },
  {
    id: "moto-filtro-oleo",
    label: "Filtro de óleo",
    category: "filtro-de-oleo",
    recommendedKmInterval: 5000,
    recommendedMonthsInterval: 8,
    estimatedCostMin: 28,
    estimatedCostMax: 90,
    typicalParts: ["Filtro de óleo", "O-ring"],
  },
  {
    id: "moto-filtro-ar",
    label: "Filtro de ar",
    category: "filtro-de-ar",
    recommendedKmInterval: 8000,
    recommendedMonthsInterval: 12,
    estimatedCostMin: 35,
    estimatedCostMax: 95,
    typicalParts: ["Elemento do filtro de ar"],
  },
  {
    id: "moto-relacao",
    label: "Kit relação",
    category: "relacao",
    recommendedKmInterval: 18000,
    recommendedMonthsInterval: 18,
    estimatedCostMin: 180,
    estimatedCostMax: 420,
    typicalParts: ["Corrente", "Pinhão", "Coroa"],
  },
  {
    id: "moto-freio",
    label: "Freios",
    category: "freio",
    recommendedKmInterval: 12000,
    recommendedMonthsInterval: 12,
    estimatedCostMin: 80,
    estimatedCostMax: 280,
    typicalParts: ["Pastilha", "Lona/sapata", "Fluido DOT"],
  },
  {
    id: "moto-pneu",
    label: "Pneus",
    category: "pneu",
    recommendedKmInterval: 18000,
    recommendedMonthsInterval: 20,
    estimatedCostMin: 520,
    estimatedCostMax: 1100,
    typicalParts: ["Pneu dianteiro", "Pneu traseiro", "Válvulas"],
  },
  {
    id: "moto-bateria",
    label: "Bateria",
    category: "bateria",
    recommendedMonthsInterval: 24,
    estimatedCostMin: 180,
    estimatedCostMax: 430,
    typicalParts: ["Bateria 12V"],
  },
  {
    id: "moto-revisao",
    label: "Revisão geral",
    category: "revisao",
    recommendedKmInterval: 6000,
    recommendedMonthsInterval: 6,
    estimatedCostMin: 150,
    estimatedCostMax: 380,
    typicalParts: ["Mão de obra", "Ajustes e reapertos"],
  },
];

const catalogYears = yearRange(2016, 2026);

interface CatalogVariantProfile {
  code: string;
  label: string;
  cityFactor: number;
  highwayFactor: number;
  tankFactor: number;
  fixedFactor: number;
  displacement?: number;
  ccDelta?: number;
}

const flexCarEngineProfiles: CatalogVariantProfile[] = [
  {
    code: "1-0",
    label: "1.0",
    displacement: 1,
    cityFactor: 1.12,
    highwayFactor: 1.11,
    tankFactor: 0.95,
    fixedFactor: 0.88,
  },
  {
    code: "1-3",
    label: "1.3",
    displacement: 1.3,
    cityFactor: 1.05,
    highwayFactor: 1.04,
    tankFactor: 0.98,
    fixedFactor: 0.96,
  },
  {
    code: "1-6",
    label: "1.6",
    displacement: 1.6,
    cityFactor: 0.97,
    highwayFactor: 0.97,
    tankFactor: 1,
    fixedFactor: 1.03,
  },
  {
    code: "2-0",
    label: "2.0",
    displacement: 2,
    cityFactor: 0.89,
    highwayFactor: 0.9,
    tankFactor: 1.04,
    fixedFactor: 1.15,
  },
];

const dieselCarEngineProfiles: CatalogVariantProfile[] = [
  {
    code: "2-0-diesel",
    label: "2.0 Diesel",
    displacement: 2,
    cityFactor: 1,
    highwayFactor: 1.02,
    tankFactor: 1,
    fixedFactor: 1,
  },
  {
    code: "2-8-diesel",
    label: "2.8 Diesel",
    displacement: 2.8,
    cityFactor: 0.91,
    highwayFactor: 0.93,
    tankFactor: 1.03,
    fixedFactor: 1.12,
  },
  {
    code: "3-0-diesel",
    label: "3.0 Diesel",
    displacement: 3,
    cityFactor: 0.87,
    highwayFactor: 0.9,
    tankFactor: 1.06,
    fixedFactor: 1.2,
  },
];

const motoTrimProfiles: CatalogVariantProfile[] = [
  {
    code: "urban-cbs",
    label: "CBS",
    cityFactor: 1.08,
    highwayFactor: 1.06,
    tankFactor: 0.96,
    fixedFactor: 0.88,
    ccDelta: -35,
  },
  {
    code: "std-abs",
    label: "ABS",
    cityFactor: 1,
    highwayFactor: 1,
    tankFactor: 1,
    fixedFactor: 1,
    ccDelta: 0,
  },
  {
    code: "adventure",
    label: "Adventure",
    cityFactor: 0.93,
    highwayFactor: 0.94,
    tankFactor: 1.06,
    fixedFactor: 1.1,
    ccDelta: 40,
  },
  {
    code: "touring",
    label: "Touring",
    cityFactor: 0.88,
    highwayFactor: 0.9,
    tankFactor: 1.1,
    fixedFactor: 1.18,
    ccDelta: 90,
  },
  {
    code: "rally-pro",
    label: "Rally Pro",
    cityFactor: 0.82,
    highwayFactor: 0.86,
    tankFactor: 1.15,
    fixedFactor: 1.25,
    ccDelta: 150,
  },
];

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function sanitizeCarModelBase(model: string) {
  return model
    .replace(/\b\d(?:[.,]\d)?(?:\s?(?:turbo|diesel|tsi|turboflex|gdi|msi|firefly|cc))?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractCarDisplacement(seed: VehiclePresetOption) {
  const source = `${seed.engineLabel ?? ""} ${seed.model}`;
  const decimal = source.match(/(\d(?:[.,]\d))/);
  if (decimal) {
    return Number.parseFloat(decimal[1].replace(",", "."));
  }

  return 1.6;
}

function extractMotoCc(seed: VehiclePresetOption) {
  const source = `${seed.engineLabel ?? ""} ${seed.model}`;
  const match = source.match(/(\d{2,4})/);
  if (!match) {
    return 160;
  }
  const value = Number.parseInt(match[1], 10);
  if (!Number.isFinite(value)) {
    return 160;
  }
  if (value <= 10) {
    return value * 100;
  }
  if (value < 90) {
    return value * 10;
  }
  return Math.min(Math.max(value, 110), 1300);
}

function toYearScopedId(seedId: string, variantCode: string, year: number) {
  return `catalog-${seedId}-${variantCode}-${year}`;
}

function buildGeneratedCarPresetEntries(seed: VehiclePresetOption) {
  const availableYears = seed.years.filter((year) => year >= 2016 && year <= 2026);
  const years = availableYears.length > 0 ? availableYears : catalogYears;

  const baseModel = sanitizeCarModelBase(seed.model) || seed.model;
  const baseDisplacement = extractCarDisplacement(seed);
  const engineProfiles =
    seed.fuelType.toLowerCase().includes("diesel") ? dieselCarEngineProfiles : flexCarEngineProfiles;

  return years.flatMap((year) =>
    engineProfiles.map((profile) => {
      const displacementFactor = profile.displacement
        ? 1 - (profile.displacement - baseDisplacement) * 0.08
        : 1;
      const efficiencyYearGain = 1 + (year - 2016) * 0.0035;
      const cityKmPerLiter = roundOneDecimal(
        Math.max(
          6.8,
          seed.averageCityKmPerLiter * profile.cityFactor * displacementFactor * efficiencyYearGain,
        ),
      );
      const highwayKmPerLiter = roundOneDecimal(
        Math.max(
          8.2,
          seed.averageHighwayKmPerLiter * profile.highwayFactor * displacementFactor * efficiencyYearGain,
        ),
      );
      const tankCapacityLiters = roundOneDecimal(
        Math.max(34, seed.tankCapacityLiters * profile.tankFactor),
      );
      const costYearFactor = 1 + (year - 2016) * 0.025;
      const ipvaAmount = Math.round(seed.fixedCosts.ipva.amount * profile.fixedFactor * costYearFactor);
      const insuranceAmount = Math.round(
        seed.fixedCosts.insurance.amount * profile.fixedFactor * costYearFactor,
      );
      const licensingAmount = Math.round(
        (seed.fixedCosts.licensing.amount || 180) * costYearFactor,
      );
      const modelWithEngine = `${baseModel} ${profile.label}`.trim();

      return {
        id: toYearScopedId(seed.id, profile.code, year),
        label: `${seed.brand} ${modelWithEngine} ${year}`.trim(),
        vehicleType: "car" as const,
        brand: seed.brand,
        model: modelWithEngine,
        engineLabel: profile.label,
        segment: seed.segment ?? "carro-popular",
        fuelType: seed.fuelType,
        averageCityKmPerLiter: cityKmPerLiter,
        averageHighwayKmPerLiter: highwayKmPerLiter,
        tankCapacityLiters,
        fixedCosts: buildFixedCosts(ipvaAmount, insuranceAmount, licensingAmount),
        years: [year],
      } satisfies VehiclePresetOption;
    }),
  );
}

function buildGeneratedMotoPresetEntries(seed: VehiclePresetOption) {
  const availableYears = seed.years.filter((year) => year >= 2016 && year <= 2026);
  const years = availableYears.length > 0 ? availableYears : catalogYears;

  const baseCc = extractMotoCc(seed);
  const modelBase = seed.model.replace(/\s{2,}/g, " ").trim();

  return years.flatMap((year) =>
    motoTrimProfiles.map((profile) => {
      const cc = Math.min(1300, Math.max(110, baseCc + (profile.ccDelta ?? 0)));
      const displacementFactor = 1 - (cc - baseCc) / 1800;
      const efficiencyYearGain = 1 + (year - 2016) * 0.003;
      const cityKmPerLiter = roundOneDecimal(
        Math.max(
          14,
          seed.averageCityKmPerLiter * profile.cityFactor * displacementFactor * efficiencyYearGain,
        ),
      );
      const highwayKmPerLiter = roundOneDecimal(
        Math.max(
          17,
          seed.averageHighwayKmPerLiter * profile.highwayFactor * displacementFactor * efficiencyYearGain,
        ),
      );
      const tankCapacityLiters = roundOneDecimal(
        Math.max(4, seed.tankCapacityLiters * profile.tankFactor),
      );
      const costYearFactor = 1 + (year - 2016) * 0.024;
      const ipvaAmount = Math.round(seed.fixedCosts.ipva.amount * profile.fixedFactor * costYearFactor);
      const insuranceAmount = Math.round(
        seed.fixedCosts.insurance.amount * profile.fixedFactor * costYearFactor,
      );
      const licensingAmount = Math.round(
        (seed.fixedCosts.licensing.amount || 180) * costYearFactor,
      );
      const modelWithTrim = `${modelBase} ${cc} ${profile.label}`.trim();

      return {
        id: toYearScopedId(seed.id, profile.code, year),
        label: `${seed.brand} ${modelWithTrim} ${year}`.trim(),
        vehicleType: "motorcycle" as const,
        brand: seed.brand,
        model: modelWithTrim,
        engineLabel: `${cc} cc`,
        segment: seed.segment ?? "moto-popular",
        fuelType: seed.fuelType,
        averageCityKmPerLiter: cityKmPerLiter,
        averageHighwayKmPerLiter: highwayKmPerLiter,
        tankCapacityLiters,
        fixedCosts: buildFixedCosts(ipvaAmount, insuranceAmount, licensingAmount),
        years: [year],
      } satisfies VehiclePresetOption;
    }),
  );
}

function buildLargeVehiclePresetCatalog() {
  const generated: VehiclePresetOption[] = [];
  const ids = new Set(vehiclePresetSeedOptions.map((option) => option.id));

  for (const seed of vehiclePresetSeedOptions) {
    const entries =
      seed.vehicleType === "car"
        ? buildGeneratedCarPresetEntries(seed)
        : buildGeneratedMotoPresetEntries(seed);

    for (const entry of entries) {
      if (ids.has(entry.id)) {
        continue;
      }
      ids.add(entry.id);
      generated.push(entry);
    }
  }

  return generated;
}

const carMaintenanceReferences: VehicleMaintenanceReference[] = [
  {
    id: "car-oleo",
    label: "Troca de óleo e filtro",
    category: "troca-de-oleo",
    recommendedKmInterval: 10000,
    recommendedMonthsInterval: 12,
    estimatedCostMin: 220,
    estimatedCostMax: 480,
    typicalParts: ["Óleo 5W-30/0W-20", "Filtro de óleo", "Arruela do cárter"],
  },
  {
    id: "car-filtro-ar",
    label: "Filtro de ar e cabine",
    category: "filtro-de-ar",
    recommendedKmInterval: 12000,
    recommendedMonthsInterval: 12,
    estimatedCostMin: 120,
    estimatedCostMax: 320,
    typicalParts: ["Filtro de ar", "Filtro de cabine"],
  },
  {
    id: "car-freio",
    label: "Freios",
    category: "freio",
    recommendedKmInterval: 25000,
    recommendedMonthsInterval: 18,
    estimatedCostMin: 260,
    estimatedCostMax: 780,
    typicalParts: ["Pastilhas", "Disco/tambor", "Fluido DOT4"],
  },
  {
    id: "car-pneu",
    label: "Jogo de pneus",
    category: "pneu",
    recommendedKmInterval: 45000,
    recommendedMonthsInterval: 36,
    estimatedCostMin: 1600,
    estimatedCostMax: 3200,
    typicalParts: ["4 pneus", "Alinhamento", "Balanceamento"],
  },
  {
    id: "car-bateria",
    label: "Bateria",
    category: "bateria",
    recommendedMonthsInterval: 30,
    estimatedCostMin: 420,
    estimatedCostMax: 980,
    typicalParts: ["Bateria 60Ah/70Ah"],
  },
  {
    id: "car-revisao",
    label: "Revisão geral",
    category: "revisao",
    recommendedKmInterval: 10000,
    recommendedMonthsInterval: 12,
    estimatedCostMin: 380,
    estimatedCostMax: 1400,
    typicalParts: ["Mão de obra", "Scanner", "Itens de desgaste"],
  },
  {
    id: "car-correia",
    label: "Correia e tensionador",
    category: "outros",
    recommendedKmInterval: 60000,
    recommendedMonthsInterval: 48,
    estimatedCostMin: 720,
    estimatedCostMax: 1900,
    typicalParts: ["Correia", "Tensor", "Polias"],
  },
];

const coreVehiclePresetSeedOptions: VehiclePresetOption[] = [
  {
    id: "cg-160",
    label: "Honda CG 160",
    vehicleType: "motorcycle",
    brand: "Honda",
    model: "CG 160",
    fuelType: "Flex",
    averageCityKmPerLiter: 42,
    averageHighwayKmPerLiter: 45,
    tankCapacityLiters: 16,
    fixedCosts: buildFixedCosts(220, 480),
    years: yearRange(2016),
  },
  {
    id: "biz-125",
    label: "Honda Biz 125",
    vehicleType: "motorcycle",
    brand: "Honda",
    model: "Biz 125",
    fuelType: "Flex",
    averageCityKmPerLiter: 47,
    averageHighwayKmPerLiter: 50,
    tankCapacityLiters: 5.1,
    fixedCosts: buildFixedCosts(180, 420),
    years: yearRange(2016),
  },
  {
    id: "bros-160",
    label: "Honda NXR Bros 160",
    vehicleType: "motorcycle",
    brand: "Honda",
    model: "NXR Bros 160",
    fuelType: "Flex",
    averageCityKmPerLiter: 38,
    averageHighwayKmPerLiter: 41,
    tankCapacityLiters: 12,
    fixedCosts: buildFixedCosts(260, 620),
    years: yearRange(2016),
  },
  {
    id: "xre-300",
    label: "Honda XRE 300",
    vehicleType: "motorcycle",
    brand: "Honda",
    model: "XRE 300",
    fuelType: "Flex",
    averageCityKmPerLiter: 30,
    averageHighwayKmPerLiter: 34,
    tankCapacityLiters: 13.8,
    fixedCosts: buildFixedCosts(410, 980),
    years: yearRange(2016),
  },
  {
    id: "pcx-160",
    label: "Honda PCX 160",
    vehicleType: "motorcycle",
    brand: "Honda",
    model: "PCX 160",
    fuelType: "Gasolina",
    averageCityKmPerLiter: 40,
    averageHighwayKmPerLiter: 43,
    tankCapacityLiters: 8.1,
    fixedCosts: buildFixedCosts(280, 720),
    years: yearRange(2021),
  },
  {
    id: "factor-150",
    label: "Yamaha Factor 150",
    vehicleType: "motorcycle",
    brand: "Yamaha",
    model: "Factor 150",
    fuelType: "Flex",
    averageCityKmPerLiter: 41,
    averageHighwayKmPerLiter: 44,
    tankCapacityLiters: 15.7,
    fixedCosts: buildFixedCosts(210, 490),
    years: yearRange(2016),
  },
  {
    id: "fazer-250",
    label: "Yamaha Fazer 250",
    vehicleType: "motorcycle",
    brand: "Yamaha",
    model: "Fazer 250",
    fuelType: "Flex",
    averageCityKmPerLiter: 32,
    averageHighwayKmPerLiter: 37,
    tankCapacityLiters: 14,
    fixedCosts: buildFixedCosts(340, 820),
    years: yearRange(2016),
  },
  {
    id: "pop-110i",
    label: "Honda Pop 110i",
    vehicleType: "motorcycle",
    brand: "Honda",
    model: "Pop 110i",
    fuelType: "Gasolina",
    averageCityKmPerLiter: 50,
    averageHighwayKmPerLiter: 55,
    tankCapacityLiters: 4.2,
    fixedCosts: buildFixedCosts(150, 360),
    years: yearRange(2016),
  },
  {
    id: "onix-1-0",
    label: "Chevrolet Onix 1.0",
    vehicleType: "car",
    brand: "Chevrolet",
    model: "Onix 1.0",
    fuelType: "Flex",
    averageCityKmPerLiter: 13.1,
    averageHighwayKmPerLiter: 16.1,
    tankCapacityLiters: 44,
    fixedCosts: buildFixedCosts(1250, 2400),
    years: yearRange(2016),
  },
  {
    id: "onix-plus-1-0-turbo",
    label: "Chevrolet Onix Plus 1.0 Turbo",
    vehicleType: "car",
    brand: "Chevrolet",
    model: "Onix Plus 1.0 Turbo",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.4,
    averageHighwayKmPerLiter: 16.9,
    tankCapacityLiters: 44,
    fixedCosts: buildFixedCosts(1450, 2800),
    years: yearRange(2020),
  },
  {
    id: "prisma-1-0-2015",
    label: "Chevrolet Prisma 1.0 (legado)",
    vehicleType: "car",
    brand: "Chevrolet",
    model: "Prisma 1.0",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.2,
    averageHighwayKmPerLiter: 15.2,
    tankCapacityLiters: 54,
    fixedCosts: buildFixedCosts(1100, 1900),
    years: [2015],
  },
  {
    id: "hb20-1-0",
    label: "Hyundai HB20 1.0",
    vehicleType: "car",
    brand: "Hyundai",
    model: "HB20 1.0",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.8,
    averageHighwayKmPerLiter: 15.6,
    tankCapacityLiters: 50,
    fixedCosts: buildFixedCosts(1350, 2500),
    years: yearRange(2016),
  },
  {
    id: "ka-1-0",
    label: "Ford Ka 1.0",
    vehicleType: "car",
    brand: "Ford",
    model: "Ka 1.0",
    fuelType: "Flex",
    averageCityKmPerLiter: 13,
    averageHighwayKmPerLiter: 15.1,
    tankCapacityLiters: 51,
    fixedCosts: buildFixedCosts(1180, 2200),
    years: yearRange(2016, 2021),
  },
  {
    id: "gol-1-0",
    label: "Volkswagen Gol 1.0",
    vehicleType: "car",
    brand: "Volkswagen",
    model: "Gol 1.0",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.2,
    averageHighwayKmPerLiter: 14.8,
    tankCapacityLiters: 55,
    fixedCosts: buildFixedCosts(1220, 2300),
    years: yearRange(2016, 2023),
  },
  {
    id: "gol-1-5-2016",
    label: "Volkswagen Gol 1.5 2016",
    vehicleType: "car",
    brand: "Volkswagen",
    model: "Gol 1.5",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.2,
    averageHighwayKmPerLiter: 14.1,
    tankCapacityLiters: 55,
    fixedCosts: buildFixedCosts(1250, 2100),
    years: [2016],
  },
  {
    id: "argo-1-0",
    label: "Fiat Argo 1.0",
    vehicleType: "car",
    brand: "Fiat",
    model: "Argo 1.0",
    fuelType: "Flex",
    averageCityKmPerLiter: 13.6,
    averageHighwayKmPerLiter: 15.7,
    tankCapacityLiters: 48,
    fixedCosts: buildFixedCosts(1310, 2450),
    years: yearRange(2017),
  },
  {
    id: "mobi-1-0",
    label: "Fiat Mobi 1.0",
    vehicleType: "car",
    brand: "Fiat",
    model: "Mobi 1.0",
    fuelType: "Flex",
    averageCityKmPerLiter: 13.5,
    averageHighwayKmPerLiter: 15.4,
    tankCapacityLiters: 47,
    fixedCosts: buildFixedCosts(980, 2100),
    years: yearRange(2016),
  },
  {
    id: "kwid-1-0",
    label: "Renault Kwid 1.0",
    vehicleType: "car",
    brand: "Renault",
    model: "Kwid 1.0",
    fuelType: "Flex",
    averageCityKmPerLiter: 14.9,
    averageHighwayKmPerLiter: 15.6,
    tankCapacityLiters: 38,
    fixedCosts: buildFixedCosts(890, 2050),
    years: yearRange(2017),
  },
  {
    id: "polo-1-0-tsi",
    label: "Volkswagen Polo 1.0 TSI",
    vehicleType: "car",
    brand: "Volkswagen",
    model: "Polo 1.0 TSI",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.7,
    averageHighwayKmPerLiter: 15.5,
    tankCapacityLiters: 52,
    fixedCosts: buildFixedCosts(1480, 2850),
    years: yearRange(2018),
  },
  {
    id: "virtus-1-0-tsi",
    label: "Volkswagen Virtus 1.0 TSI",
    vehicleType: "car",
    brand: "Volkswagen",
    model: "Virtus 1.0 TSI",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.4,
    averageHighwayKmPerLiter: 15.8,
    tankCapacityLiters: 52,
    fixedCosts: buildFixedCosts(1550, 3000),
    years: yearRange(2018),
  },
  {
    id: "nivus-1-0-tsi",
    label: "Volkswagen Nivus 1.0 TSI",
    vehicleType: "car",
    brand: "Volkswagen",
    model: "Nivus 1.0 TSI",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.7,
    averageHighwayKmPerLiter: 14.8,
    tankCapacityLiters: 52,
    fixedCosts: buildFixedCosts(1710, 3200),
    years: yearRange(2020),
  },
  {
    id: "corolla-2-0",
    label: "Toyota Corolla 2.0",
    vehicleType: "car",
    brand: "Toyota",
    model: "Corolla 2.0",
    fuelType: "Flex",
    averageCityKmPerLiter: 10.8,
    averageHighwayKmPerLiter: 13.3,
    tankCapacityLiters: 50,
    fixedCosts: buildFixedCosts(2200, 4200),
    years: yearRange(2016),
  },
  {
    id: "yaris-1-5",
    label: "Toyota Yaris 1.5",
    vehicleType: "car",
    brand: "Toyota",
    model: "Yaris 1.5",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.1,
    averageHighwayKmPerLiter: 14.6,
    tankCapacityLiters: 45,
    fixedCosts: buildFixedCosts(1650, 3200),
    years: yearRange(2018, 2024),
  },
  {
    id: "civic-2-0",
    label: "Honda Civic 2.0",
    vehicleType: "car",
    brand: "Honda",
    model: "Civic 2.0",
    fuelType: "Flex",
    averageCityKmPerLiter: 10.4,
    averageHighwayKmPerLiter: 13.4,
    tankCapacityLiters: 56,
    fixedCosts: buildFixedCosts(2100, 4100),
    years: yearRange(2016, 2021),
  },
  {
    id: "cronos-1-3",
    label: "Fiat Cronos 1.3",
    vehicleType: "car",
    brand: "Fiat",
    model: "Cronos 1.3",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.9,
    averageHighwayKmPerLiter: 14.6,
    tankCapacityLiters: 48,
    fixedCosts: buildFixedCosts(1380, 2650),
    years: yearRange(2018),
  },
  {
    id: "tracker-1-0-turbo",
    label: "Chevrolet Tracker 1.0 Turbo",
    vehicleType: "car",
    brand: "Chevrolet",
    model: "Tracker 1.0 Turbo",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.6,
    averageHighwayKmPerLiter: 13.8,
    tankCapacityLiters: 44,
    fixedCosts: buildFixedCosts(1980, 3600),
    years: yearRange(2021),
  },
  {
    id: "renegade-1-3-turbo",
    label: "Jeep Renegade 1.3 Turbo",
    vehicleType: "car",
    brand: "Jeep",
    model: "Renegade 1.3 Turbo",
    fuelType: "Flex",
    averageCityKmPerLiter: 10.1,
    averageHighwayKmPerLiter: 12.3,
    tankCapacityLiters: 55,
    fixedCosts: buildFixedCosts(2350, 4300),
    years: yearRange(2022),
  },
  {
    id: "compass-1-3-turbo",
    label: "Jeep Compass 1.3 Turbo",
    vehicleType: "car",
    brand: "Jeep",
    model: "Compass 1.3 Turbo",
    fuelType: "Flex",
    averageCityKmPerLiter: 9.8,
    averageHighwayKmPerLiter: 12.1,
    tankCapacityLiters: 60,
    fixedCosts: buildFixedCosts(2900, 5000),
    years: yearRange(2022),
  },
  {
    id: "creta-1-0-turbo",
    label: "Hyundai Creta 1.0 Turbo",
    vehicleType: "car",
    brand: "Hyundai",
    model: "Creta 1.0 Turbo",
    fuelType: "Flex",
    averageCityKmPerLiter: 10.9,
    averageHighwayKmPerLiter: 13.1,
    tankCapacityLiters: 50,
    fixedCosts: buildFixedCosts(2400, 4500),
    years: yearRange(2022),
  },
  {
    id: "s10-2-8-diesel",
    label: "Chevrolet S10 2.8 Diesel",
    vehicleType: "car",
    brand: "Chevrolet",
    model: "S10 2.8 Diesel",
    fuelType: "Diesel",
    averageCityKmPerLiter: 9.4,
    averageHighwayKmPerLiter: 11.8,
    tankCapacityLiters: 76,
    fixedCosts: buildFixedCosts(3300, 6200),
    years: yearRange(2016),
  },
  {
    id: "toro-1-3-turbo",
    label: "Fiat Toro 1.3 Turbo",
    vehicleType: "car",
    brand: "Fiat",
    model: "Toro 1.3 Turbo",
    fuelType: "Flex",
    averageCityKmPerLiter: 9.8,
    averageHighwayKmPerLiter: 12.1,
    tankCapacityLiters: 55,
    fixedCosts: buildFixedCosts(2550, 4700),
    years: yearRange(2022),
  },
  {
    id: "spin-1-8",
    label: "Chevrolet Spin 1.8",
    vehicleType: "car",
    brand: "Chevrolet",
    model: "Spin 1.8",
    engineLabel: "1.8 aspirado",
    segment: "familiar",
    fuelType: "Flex",
    averageCityKmPerLiter: 9.7,
    averageHighwayKmPerLiter: 11.9,
    tankCapacityLiters: 53,
    fixedCosts: buildFixedCosts(1850, 3400),
    years: yearRange(2016),
  },
  {
    id: "strada-1-3",
    label: "Fiat Strada 1.3",
    vehicleType: "car",
    brand: "Fiat",
    model: "Strada 1.3",
    engineLabel: "1.3 Firefly",
    segment: "picape",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.4,
    averageHighwayKmPerLiter: 13.8,
    tankCapacityLiters: 55,
    fixedCosts: buildFixedCosts(1880, 3300),
    years: yearRange(2021),
  },
  {
    id: "saveiro-1-6",
    label: "Volkswagen Saveiro 1.6",
    vehicleType: "car",
    brand: "Volkswagen",
    model: "Saveiro 1.6",
    engineLabel: "1.6 MSI",
    segment: "picape",
    fuelType: "Flex",
    averageCityKmPerLiter: 10.2,
    averageHighwayKmPerLiter: 12.8,
    tankCapacityLiters: 55,
    fixedCosts: buildFixedCosts(1760, 3150),
    years: yearRange(2016),
  },
  {
    id: "montana-1-2-turbo",
    label: "Chevrolet Montana 1.2 Turbo",
    vehicleType: "car",
    brand: "Chevrolet",
    model: "Montana 1.2 Turbo",
    engineLabel: "1.2 Turbo",
    segment: "picape",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.3,
    averageHighwayKmPerLiter: 13.5,
    tankCapacityLiters: 44,
    fixedCosts: buildFixedCosts(2050, 3850),
    years: yearRange(2023),
  },
  {
    id: "uno-1-0",
    label: "Fiat Uno 1.0",
    vehicleType: "car",
    brand: "Fiat",
    model: "Uno 1.0",
    engineLabel: "1.0 Fire",
    segment: "hatch",
    fuelType: "Flex",
    averageCityKmPerLiter: 13.2,
    averageHighwayKmPerLiter: 15.1,
    tankCapacityLiters: 48,
    fixedCosts: buildFixedCosts(980, 1900),
    years: yearRange(2016, 2021),
  },
  {
    id: "sandero-1-0",
    label: "Renault Sandero 1.0",
    vehicleType: "car",
    brand: "Renault",
    model: "Sandero 1.0",
    engineLabel: "1.0 SCe",
    segment: "hatch",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.8,
    averageHighwayKmPerLiter: 14.9,
    tankCapacityLiters: 50,
    fixedCosts: buildFixedCosts(1120, 2100),
    years: yearRange(2016, 2022),
  },
  {
    id: "voyage-1-6",
    label: "Volkswagen Voyage 1.6",
    vehicleType: "car",
    brand: "Volkswagen",
    model: "Voyage 1.6",
    engineLabel: "1.6 MSI",
    segment: "sedan",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.5,
    averageHighwayKmPerLiter: 13.9,
    tankCapacityLiters: 55,
    fixedCosts: buildFixedCosts(1350, 2400),
    years: yearRange(2016, 2023),
  },
  {
    id: "versa-1-6",
    label: "Nissan Versa 1.6",
    vehicleType: "car",
    brand: "Nissan",
    model: "Versa 1.6",
    engineLabel: "1.6 aspirado",
    segment: "sedan",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.3,
    averageHighwayKmPerLiter: 14.7,
    tankCapacityLiters: 41,
    fixedCosts: buildFixedCosts(1650, 3000),
    years: yearRange(2020),
  },
  {
    id: "city-1-5",
    label: "Honda City 1.5",
    vehicleType: "car",
    brand: "Honda",
    model: "City 1.5",
    engineLabel: "1.5 aspirado",
    segment: "sedan",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.6,
    averageHighwayKmPerLiter: 14.8,
    tankCapacityLiters: 40,
    fixedCosts: buildFixedCosts(1820, 3320),
    years: yearRange(2022),
  },
  {
    id: "kicks-1-6",
    label: "Nissan Kicks 1.6",
    vehicleType: "car",
    brand: "Nissan",
    model: "Kicks 1.6",
    engineLabel: "1.6 aspirado",
    segment: "suv",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.5,
    averageHighwayKmPerLiter: 13.8,
    tankCapacityLiters: 41,
    fixedCosts: buildFixedCosts(1860, 3450),
    years: yearRange(2017),
  },
  {
    id: "tcross-1-0-tsi",
    label: "Volkswagen T-Cross 1.0 TSI",
    vehicleType: "car",
    brand: "Volkswagen",
    model: "T-Cross 1.0 TSI",
    engineLabel: "1.0 TSI",
    segment: "suv",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.2,
    averageHighwayKmPerLiter: 13.6,
    tankCapacityLiters: 52,
    fixedCosts: buildFixedCosts(2150, 3900),
    years: yearRange(2020),
  },
  {
    id: "pulse-1-0-turbo",
    label: "Fiat Pulse 1.0 Turbo",
    vehicleType: "car",
    brand: "Fiat",
    model: "Pulse 1.0 Turbo",
    engineLabel: "1.0 Turbo 200",
    segment: "suv",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.8,
    averageHighwayKmPerLiter: 14.2,
    tankCapacityLiters: 47,
    fixedCosts: buildFixedCosts(1820, 3350),
    years: yearRange(2022),
  },
  {
    id: "fastback-1-0-turbo",
    label: "Fiat Fastback 1.0 Turbo",
    vehicleType: "car",
    brand: "Fiat",
    model: "Fastback 1.0 Turbo",
    engineLabel: "1.0 Turbo 200",
    segment: "suv-coupe",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.2,
    averageHighwayKmPerLiter: 13.7,
    tankCapacityLiters: 47,
    fixedCosts: buildFixedCosts(1980, 3700),
    years: yearRange(2023),
  },
  {
    id: "c3-1-0",
    label: "Citroën C3 1.0",
    vehicleType: "car",
    brand: "Citroën",
    model: "C3 1.0",
    engineLabel: "1.0 Firefly",
    segment: "hatch",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.9,
    averageHighwayKmPerLiter: 14.9,
    tankCapacityLiters: 47,
    fixedCosts: buildFixedCosts(1320, 2500),
    years: yearRange(2023),
  },
  {
    id: "peugeot-208-1-0-turbo",
    label: "Peugeot 208 1.0 Turbo",
    vehicleType: "car",
    brand: "Peugeot",
    model: "208 1.0 Turbo",
    engineLabel: "1.0 Turbo 200",
    segment: "hatch",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.2,
    averageHighwayKmPerLiter: 14.8,
    tankCapacityLiters: 47,
    fixedCosts: buildFixedCosts(1580, 2860),
    years: yearRange(2024),
  },
  {
    id: "hilux-2-8-diesel",
    label: "Toyota Hilux 2.8 Diesel",
    vehicleType: "car",
    brand: "Toyota",
    model: "Hilux 2.8 Diesel",
    engineLabel: "2.8 Diesel",
    segment: "picape",
    fuelType: "Diesel",
    averageCityKmPerLiter: 9.1,
    averageHighwayKmPerLiter: 11.1,
    tankCapacityLiters: 80,
    fixedCosts: buildFixedCosts(4200, 7600),
    years: yearRange(2016),
  },
  {
    id: "crosser-150",
    label: "Yamaha Crosser 150",
    vehicleType: "motorcycle",
    brand: "Yamaha",
    model: "Crosser 150",
    engineLabel: "150 cc",
    segment: "trail",
    fuelType: "Flex",
    averageCityKmPerLiter: 40,
    averageHighwayKmPerLiter: 44,
    tankCapacityLiters: 12,
    fixedCosts: buildFixedCosts(240, 560),
    years: yearRange(2016),
  },
  {
    id: "lander-250",
    label: "Yamaha Lander 250",
    vehicleType: "motorcycle",
    brand: "Yamaha",
    model: "Lander 250",
    engineLabel: "250 cc",
    segment: "trail",
    fuelType: "Flex",
    averageCityKmPerLiter: 31,
    averageHighwayKmPerLiter: 35,
    tankCapacityLiters: 13.6,
    fixedCosts: buildFixedCosts(420, 980),
    years: yearRange(2020),
  },
  {
    id: "cb300f",
    label: "Honda CB 300F",
    vehicleType: "motorcycle",
    brand: "Honda",
    model: "CB 300F",
    engineLabel: "300 cc",
    segment: "street",
    fuelType: "Flex",
    averageCityKmPerLiter: 30,
    averageHighwayKmPerLiter: 34,
    tankCapacityLiters: 14.1,
    fixedCosts: buildFixedCosts(450, 1050),
    years: yearRange(2023),
  },
  {
    id: "sahara-300",
    label: "Honda Sahara 300",
    vehicleType: "motorcycle",
    brand: "Honda",
    model: "Sahara 300",
    engineLabel: "300 cc",
    segment: "trail",
    fuelType: "Flex",
    averageCityKmPerLiter: 28,
    averageHighwayKmPerLiter: 32,
    tankCapacityLiters: 13.8,
    fixedCosts: buildFixedCosts(520, 1250),
    years: yearRange(2024),
  },
  {
    id: "factor-125i",
    label: "Yamaha Factor 125i",
    vehicleType: "motorcycle",
    brand: "Yamaha",
    model: "Factor 125i",
    engineLabel: "125 cc",
    segment: "street",
    fuelType: "Flex",
    averageCityKmPerLiter: 45,
    averageHighwayKmPerLiter: 50,
    tankCapacityLiters: 15.7,
    fixedCosts: buildFixedCosts(190, 450),
    years: yearRange(2016),
  },
  {
    id: "start-160",
    label: "Honda Start 160",
    vehicleType: "motorcycle",
    brand: "Honda",
    model: "Start 160",
    engineLabel: "160 cc",
    segment: "street",
    fuelType: "Flex",
    averageCityKmPerLiter: 41,
    averageHighwayKmPerLiter: 45,
    tankCapacityLiters: 14.6,
    fixedCosts: buildFixedCosts(210, 500),
    years: yearRange(2024),
  },
  {
    id: "hb20s-1-0-turbo",
    label: "Hyundai HB20S 1.0 Turbo",
    vehicleType: "car",
    brand: "Hyundai",
    model: "HB20S 1.0 Turbo",
    engineLabel: "1.0 Turbo GDI",
    segment: "sedan",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.3,
    averageHighwayKmPerLiter: 15.2,
    tankCapacityLiters: 50,
    fixedCosts: buildFixedCosts(1620, 2950),
    years: yearRange(2020),
  },
  {
    id: "city-hatch-1-5",
    label: "Honda City Hatch 1.5",
    vehicleType: "car",
    brand: "Honda",
    model: "City Hatch 1.5",
    engineLabel: "1.5 aspirado",
    segment: "hatch",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.4,
    averageHighwayKmPerLiter: 14.8,
    tankCapacityLiters: 40,
    fixedCosts: buildFixedCosts(1760, 3200),
    years: yearRange(2022),
  },
  {
    id: "hrv-1-5-turbo",
    label: "Honda HR-V 1.5 Turbo",
    vehicleType: "car",
    brand: "Honda",
    model: "HR-V 1.5 Turbo",
    engineLabel: "1.5 Turbo",
    segment: "suv",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.6,
    averageHighwayKmPerLiter: 13.9,
    tankCapacityLiters: 50,
    fixedCosts: buildFixedCosts(2480, 4550),
    years: yearRange(2023),
  },
  {
    id: "corolla-cross-2-0",
    label: "Toyota Corolla Cross 2.0",
    vehicleType: "car",
    brand: "Toyota",
    model: "Corolla Cross 2.0",
    engineLabel: "2.0 aspirado",
    segment: "suv",
    fuelType: "Flex",
    averageCityKmPerLiter: 10.9,
    averageHighwayKmPerLiter: 12.8,
    tankCapacityLiters: 47,
    fixedCosts: buildFixedCosts(2650, 4900),
    years: yearRange(2021),
  },
  {
    id: "duster-1-6",
    label: "Renault Duster 1.6",
    vehicleType: "car",
    brand: "Renault",
    model: "Duster 1.6",
    engineLabel: "1.6 SCe",
    segment: "suv",
    fuelType: "Flex",
    averageCityKmPerLiter: 10.4,
    averageHighwayKmPerLiter: 12.7,
    tankCapacityLiters: 50,
    fixedCosts: buildFixedCosts(1810, 3320),
    years: yearRange(2021),
  },
  {
    id: "fox-1-6",
    label: "Volkswagen Fox 1.6",
    vehicleType: "car",
    brand: "Volkswagen",
    model: "Fox 1.6",
    engineLabel: "1.6 MSI",
    segment: "hatch",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.7,
    averageHighwayKmPerLiter: 14.2,
    tankCapacityLiters: 50,
    fixedCosts: buildFixedCosts(1260, 2250),
    years: yearRange(2016, 2021),
  },
  {
    id: "argo-1-3",
    label: "Fiat Argo 1.3",
    vehicleType: "car",
    brand: "Fiat",
    model: "Argo 1.3",
    engineLabel: "1.3 Firefly",
    segment: "hatch",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.1,
    averageHighwayKmPerLiter: 14.7,
    tankCapacityLiters: 48,
    fixedCosts: buildFixedCosts(1420, 2700),
    years: yearRange(2018),
  },
  {
    id: "commander-1-3-turbo",
    label: "Jeep Commander 1.3 Turbo",
    vehicleType: "car",
    brand: "Jeep",
    model: "Commander 1.3 Turbo",
    engineLabel: "1.3 Turbo",
    segment: "suv",
    fuelType: "Flex",
    averageCityKmPerLiter: 9.4,
    averageHighwayKmPerLiter: 11.7,
    tankCapacityLiters: 61,
    fixedCosts: buildFixedCosts(3350, 6200),
    years: yearRange(2022),
  },
  {
    id: "toro-2-0-diesel",
    label: "Fiat Toro 2.0 Diesel",
    vehicleType: "car",
    brand: "Fiat",
    model: "Toro 2.0 Diesel",
    engineLabel: "2.0 Diesel",
    segment: "picape",
    fuelType: "Diesel",
    averageCityKmPerLiter: 10.1,
    averageHighwayKmPerLiter: 12.6,
    tankCapacityLiters: 60,
    fixedCosts: buildFixedCosts(2780, 5200),
    years: yearRange(2016, 2022),
  },
  {
    id: "honda-adv-150",
    label: "Honda ADV 150",
    vehicleType: "motorcycle",
    brand: "Honda",
    model: "ADV 150",
    engineLabel: "150 cc",
    segment: "scooter",
    fuelType: "Gasolina",
    averageCityKmPerLiter: 38,
    averageHighwayKmPerLiter: 42,
    tankCapacityLiters: 8,
    fixedCosts: buildFixedCosts(240, 600),
    years: yearRange(2021, 2024),
  },
  {
    id: "cb250f-twister",
    label: "Honda CB 250F Twister",
    vehicleType: "motorcycle",
    brand: "Honda",
    model: "CB 250F Twister",
    engineLabel: "250 cc",
    segment: "street",
    fuelType: "Flex",
    averageCityKmPerLiter: 33,
    averageHighwayKmPerLiter: 37,
    tankCapacityLiters: 16.5,
    fixedCosts: buildFixedCosts(330, 780),
    years: yearRange(2016, 2022),
  },
  {
    id: "mt03-320",
    label: "Yamaha MT-03",
    vehicleType: "motorcycle",
    brand: "Yamaha",
    model: "MT-03",
    engineLabel: "320 cc",
    segment: "street",
    fuelType: "Gasolina",
    averageCityKmPerLiter: 24,
    averageHighwayKmPerLiter: 28,
    tankCapacityLiters: 14,
    fixedCosts: buildFixedCosts(560, 1280),
    years: yearRange(2016),
  },
  {
    id: "bmw-g310gs",
    label: "BMW G 310 GS",
    vehicleType: "motorcycle",
    brand: "BMW",
    model: "G 310 GS",
    engineLabel: "313 cc",
    segment: "trail",
    fuelType: "Gasolina",
    averageCityKmPerLiter: 27,
    averageHighwayKmPerLiter: 31,
    tankCapacityLiters: 11,
    fixedCosts: buildFixedCosts(760, 1850),
    years: yearRange(2018),
  },
  {
    id: "bmw-g310r",
    label: "BMW G 310 R",
    vehicleType: "motorcycle",
    brand: "BMW",
    model: "G 310 R",
    engineLabel: "313 cc",
    segment: "street",
    fuelType: "Gasolina",
    averageCityKmPerLiter: 26,
    averageHighwayKmPerLiter: 30,
    tankCapacityLiters: 11,
    fixedCosts: buildFixedCosts(740, 1780),
    years: yearRange(2018),
  },
  {
    id: "bmw-f850gs",
    label: "BMW F 850 GS",
    vehicleType: "motorcycle",
    brand: "BMW",
    model: "F 850 GS",
    engineLabel: "853 cc",
    segment: "big-trail",
    fuelType: "Gasolina",
    averageCityKmPerLiter: 19,
    averageHighwayKmPerLiter: 23,
    tankCapacityLiters: 15,
    fixedCosts: buildFixedCosts(1450, 3600),
    years: yearRange(2019),
  },
];

interface VehicleCatalogCoverageModel {
  brand: string;
  model: string;
  vehicleType: VehicleType;
  segment?: string;
  fuelType?: string;
  engineLabel?: string;
  yearStart?: number;
  yearEnd?: number;
}

const carSegmentProfiles: Record<
  string,
  { cityBase: number; tankBase: number; ipvaBase: number; insuranceBase: number }
> = {
  hatch: { cityBase: 13.2, tankBase: 47, ipvaBase: 1200, insuranceBase: 2200 },
  sedan: { cityBase: 12.1, tankBase: 50, ipvaBase: 1450, insuranceBase: 2600 },
  suv: { cityBase: 10.7, tankBase: 52, ipvaBase: 2150, insuranceBase: 3950 },
  "suv-coupe": { cityBase: 10.4, tankBase: 52, ipvaBase: 2400, insuranceBase: 4400 },
  picape: { cityBase: 10.1, tankBase: 70, ipvaBase: 2850, insuranceBase: 5200 },
  familiar: { cityBase: 10.6, tankBase: 53, ipvaBase: 1750, insuranceBase: 3200 },
  premium: { cityBase: 9.6, tankBase: 60, ipvaBase: 4100, insuranceBase: 7900 },
  crossover: { cityBase: 11.2, tankBase: 50, ipvaBase: 1950, insuranceBase: 3400 },
  van: { cityBase: 9.2, tankBase: 70, ipvaBase: 3100, insuranceBase: 5600 },
};

const motoSegmentProfiles: Record<
  string,
  { cityBias: number; highwayBias: number; tankBase: number; ipvaBase: number; insuranceBase: number }
> = {
  street: { cityBias: 1, highwayBias: 1.05, tankBase: 14, ipvaBase: 240, insuranceBase: 560 },
  trail: { cityBias: 0.95, highwayBias: 1.02, tankBase: 13.5, ipvaBase: 340, insuranceBase: 820 },
  scooter: { cityBias: 1.06, highwayBias: 1.05, tankBase: 8.5, ipvaBase: 210, insuranceBase: 520 },
  sport: { cityBias: 0.82, highwayBias: 0.93, tankBase: 15, ipvaBase: 620, insuranceBase: 1450 },
  touring: { cityBias: 0.78, highwayBias: 0.9, tankBase: 17, ipvaBase: 920, insuranceBase: 2200 },
  custom: { cityBias: 0.86, highwayBias: 0.95, tankBase: 14.5, ipvaBase: 560, insuranceBase: 1250 },
  "big-trail": { cityBias: 0.74, highwayBias: 0.9, tankBase: 19, ipvaBase: 1200, insuranceBase: 2850 },
};

const premiumMotoBrands = new Set(["BMW", "Ducati", "Triumph", "Kawasaki"]);

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeSlugLabel(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractDisplacementLitersFromModel(model: string, fallback = 1.3) {
  const match = model.match(/(\d(?:[.,]\d)?)/);
  if (!match) {
    return fallback;
  }
  const parsed = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clampNumber(parsed, 1, 3.5);
}

function extractCcFromModel(model: string, fallback = 160) {
  const match = model.match(/(\d{2,4})/);
  if (!match) {
    return fallback;
  }
  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (parsed < 90) {
    return parsed * 10;
  }
  return clampNumber(parsed, 100, 1300);
}

function toCoverageModelKey(model: Pick<VehicleCatalogCoverageModel, "brand" | "model" | "vehicleType">) {
  return `${model.vehicleType}::${model.brand.toLowerCase()}::${model.model.toLowerCase()}`;
}

function buildCoveragePreset(model: VehicleCatalogCoverageModel): VehiclePresetOption {
  const yearStart = model.yearStart ?? 2016;
  const yearEnd = model.yearEnd ?? 2026;
  const years = yearRange(yearStart, yearEnd);
  const id = `br-${normalizeSlugLabel(`${model.brand}-${model.model}`)}`;

  if (model.vehicleType === "car") {
    const segmentProfile = carSegmentProfiles[model.segment ?? "hatch"] ?? carSegmentProfiles.hatch;
    const displacement = extractDisplacementLitersFromModel(model.model);
    const displacementFactor = clampNumber(1.14 - (displacement - 1) * 0.2, 0.68, 1.2);
    const fuelType = model.fuelType ?? "Flex";
    const dieselBoost = fuelType.toLowerCase().includes("diesel") ? 1.06 : 1;
    const cityKmPerLiter = roundOneDecimal(
      clampNumber(segmentProfile.cityBase * displacementFactor * dieselBoost, 7.8, 18.4),
    );
    const highwayKmPerLiter = roundOneDecimal(clampNumber(cityKmPerLiter * 1.21, 9.8, 22.8));
    const tankCapacityLiters = roundOneDecimal(
      clampNumber(segmentProfile.tankBase + (displacement - 1) * 2.6, 36, 95),
    );
    const costFactor = clampNumber(0.92 + displacement * 0.16, 0.9, 1.7);
    const ipva = Math.round(segmentProfile.ipvaBase * costFactor);
    const insurance = Math.round(segmentProfile.insuranceBase * costFactor);

    return {
      id,
      label: `${model.brand} ${model.model}`,
      vehicleType: "car",
      brand: model.brand,
      model: model.model,
      engineLabel: model.engineLabel,
      segment: model.segment ?? "carro-popular",
      fuelType,
      averageCityKmPerLiter: cityKmPerLiter,
      averageHighwayKmPerLiter: highwayKmPerLiter,
      tankCapacityLiters,
      fixedCosts: buildFixedCosts(ipva, insurance),
      years,
    };
  }

  const segmentProfile = motoSegmentProfiles[model.segment ?? "street"] ?? motoSegmentProfiles.street;
  const cc = extractCcFromModel(model.model);
  const baseCity = clampNumber(61 - cc * 0.082, 16, 56);
  const premiumBrandFactor = premiumMotoBrands.has(model.brand) ? 1.18 : 1;
  const cityKmPerLiter = roundOneDecimal(
    clampNumber(baseCity * segmentProfile.cityBias, 15, 58),
  );
  const highwayKmPerLiter = roundOneDecimal(
    clampNumber(cityKmPerLiter * segmentProfile.highwayBias, 17, 62),
  );
  const tankCapacityLiters = roundOneDecimal(
    clampNumber(segmentProfile.tankBase + (cc - 150) / 120, 4.5, 28),
  );
  const displacementFactor = clampNumber(0.88 + cc / 800, 0.9, 2.6);
  const ipva = Math.round(segmentProfile.ipvaBase * displacementFactor * premiumBrandFactor);
  const insurance = Math.round(segmentProfile.insuranceBase * displacementFactor * premiumBrandFactor);

  return {
    id,
    label: `${model.brand} ${model.model}`,
    vehicleType: "motorcycle",
    brand: model.brand,
    model: model.model,
    engineLabel: model.engineLabel ?? `${cc} cc`,
    segment: model.segment ?? "moto-popular",
    fuelType: model.fuelType ?? "Gasolina",
    averageCityKmPerLiter: cityKmPerLiter,
    averageHighwayKmPerLiter: highwayKmPerLiter,
    tankCapacityLiters,
    fixedCosts: buildFixedCosts(ipva, insurance),
    years,
  };
}

const additionalCarCoverageModels: VehicleCatalogCoverageModel[] = [
  { brand: "Chevrolet", model: "Onix Joy 1.0", vehicleType: "car", segment: "hatch", yearStart: 2016, yearEnd: 2021 },
  { brand: "Chevrolet", model: "Onix RS 1.0 Turbo", vehicleType: "car", segment: "hatch", yearStart: 2021 },
  { brand: "Chevrolet", model: "Prisma 1.4", vehicleType: "car", segment: "sedan", yearStart: 2016, yearEnd: 2019 },
  { brand: "Chevrolet", model: "Cobalt 1.8", vehicleType: "car", segment: "sedan", yearStart: 2016, yearEnd: 2020 },
  { brand: "Chevrolet", model: "Cruze 1.4 Turbo", vehicleType: "car", segment: "sedan", yearStart: 2016, yearEnd: 2023 },
  { brand: "Chevrolet", model: "Tracker 1.2 Turbo", vehicleType: "car", segment: "suv", yearStart: 2021 },
  { brand: "Chevrolet", model: "Equinox 1.5 Turbo", vehicleType: "car", segment: "suv", yearStart: 2018 },
  { brand: "Chevrolet", model: "Trailblazer 2.8 Diesel", vehicleType: "car", segment: "picape", fuelType: "Diesel", yearStart: 2016 },
  { brand: "Chevrolet", model: "Spin Activ 1.8", vehicleType: "car", segment: "familiar", yearStart: 2016 },
  { brand: "Chevrolet", model: "Montana Premier 1.2 Turbo", vehicleType: "car", segment: "picape", yearStart: 2023 },
  { brand: "Volkswagen", model: "Up 1.0 TSI", vehicleType: "car", segment: "hatch", yearStart: 2016, yearEnd: 2021 },
  { brand: "Volkswagen", model: "Gol Track 1.0", vehicleType: "car", segment: "hatch", yearStart: 2022, yearEnd: 2023 },
  { brand: "Volkswagen", model: "Voyage 1.0", vehicleType: "car", segment: "sedan", yearStart: 2016, yearEnd: 2023 },
  { brand: "Volkswagen", model: "Polo Track 1.0", vehicleType: "car", segment: "hatch", yearStart: 2023 },
  { brand: "Volkswagen", model: "Polo GTS 1.4 TSI", vehicleType: "car", segment: "hatch", yearStart: 2020 },
  { brand: "Volkswagen", model: "Virtus 170 TSI", vehicleType: "car", segment: "sedan", yearStart: 2022 },
  { brand: "Volkswagen", model: "Virtus Exclusive 1.4 TSI", vehicleType: "car", segment: "sedan", yearStart: 2023 },
  { brand: "Volkswagen", model: "Nivus Highline 1.0 TSI", vehicleType: "car", segment: "crossover", yearStart: 2021 },
  { brand: "Volkswagen", model: "T-Cross 1.4 TSI", vehicleType: "car", segment: "suv", yearStart: 2020 },
  { brand: "Volkswagen", model: "Taos 1.4 TSI", vehicleType: "car", segment: "suv", yearStart: 2021 },
  { brand: "Volkswagen", model: "Jetta GLI 2.0 TSI", vehicleType: "car", segment: "sedan", yearStart: 2019 },
  { brand: "Volkswagen", model: "Amarok V6 3.0 Diesel", vehicleType: "car", segment: "picape", fuelType: "Diesel", yearStart: 2018 },
  { brand: "Volkswagen", model: "Saveiro Robust 1.6", vehicleType: "car", segment: "picape", yearStart: 2016 },
  { brand: "Fiat", model: "Argo 1.8", vehicleType: "car", segment: "hatch", yearStart: 2017, yearEnd: 2022 },
  { brand: "Fiat", model: "Mobi Trekking 1.0", vehicleType: "car", segment: "hatch", yearStart: 2019 },
  { brand: "Fiat", model: "Cronos 1.0", vehicleType: "car", segment: "sedan", yearStart: 2022 },
  { brand: "Fiat", model: "Pulse Abarth 1.3 Turbo", vehicleType: "car", segment: "suv", yearStart: 2022 },
  { brand: "Fiat", model: "Fastback Abarth 1.3 Turbo", vehicleType: "car", segment: "suv-coupe", yearStart: 2023 },
  { brand: "Fiat", model: "Siena 1.4", vehicleType: "car", segment: "sedan", yearStart: 2016, yearEnd: 2018 },
  { brand: "Fiat", model: "Grand Siena 1.6", vehicleType: "car", segment: "sedan", yearStart: 2016, yearEnd: 2021 },
  { brand: "Fiat", model: "Uno Way 1.3", vehicleType: "car", segment: "hatch", yearStart: 2016, yearEnd: 2021 },
  { brand: "Fiat", model: "Strada 1.4", vehicleType: "car", segment: "picape", yearStart: 2016, yearEnd: 2021 },
  { brand: "Fiat", model: "Strada Turbo 1.0", vehicleType: "car", segment: "picape", yearStart: 2024 },
  { brand: "Fiat", model: "Toro Ultra 2.0 Diesel", vehicleType: "car", segment: "picape", fuelType: "Diesel", yearStart: 2019, yearEnd: 2024 },
  { brand: "Fiat", model: "Toro Volcano 1.3 Turbo", vehicleType: "car", segment: "picape", yearStart: 2022 },
  { brand: "Hyundai", model: "HB20 1.6", vehicleType: "car", segment: "hatch", yearStart: 2016, yearEnd: 2022 },
  { brand: "Hyundai", model: "HB20S 1.6", vehicleType: "car", segment: "sedan", yearStart: 2016, yearEnd: 2022 },
  { brand: "Hyundai", model: "Creta 2.0", vehicleType: "car", segment: "suv", yearStart: 2017, yearEnd: 2024 },
  { brand: "Hyundai", model: "Tucson 1.6 Turbo", vehicleType: "car", segment: "suv", yearStart: 2018 },
  { brand: "Hyundai", model: "ix35 2.0", vehicleType: "car", segment: "suv", yearStart: 2016, yearEnd: 2022 },
  { brand: "Toyota", model: "Etios 1.3", vehicleType: "car", segment: "hatch", yearStart: 2016, yearEnd: 2021 },
  { brand: "Toyota", model: "Etios Sedan 1.5", vehicleType: "car", segment: "sedan", yearStart: 2016, yearEnd: 2021 },
  { brand: "Toyota", model: "Yaris Sedan 1.5", vehicleType: "car", segment: "sedan", yearStart: 2018, yearEnd: 2024 },
  { brand: "Toyota", model: "Corolla 1.8 Hybrid", vehicleType: "car", segment: "sedan", yearStart: 2020 },
  { brand: "Toyota", model: "Hilux SRX 2.8 Diesel", vehicleType: "car", segment: "picape", fuelType: "Diesel", yearStart: 2016 },
  { brand: "Toyota", model: "SW4 2.8 Diesel", vehicleType: "car", segment: "premium", fuelType: "Diesel", yearStart: 2016 },
  { brand: "Honda", model: "Fit 1.5", vehicleType: "car", segment: "hatch", yearStart: 2016, yearEnd: 2021 },
  { brand: "Honda", model: "WR-V 1.5", vehicleType: "car", segment: "crossover", yearStart: 2017, yearEnd: 2024 },
  { brand: "Honda", model: "Civic Touring 1.5 Turbo", vehicleType: "car", segment: "sedan", yearStart: 2017, yearEnd: 2021 },
  { brand: "Honda", model: "HR-V 1.8", vehicleType: "car", segment: "suv", yearStart: 2016, yearEnd: 2022 },
  { brand: "Honda", model: "HR-V 1.5 Turbo Touring", vehicleType: "car", segment: "suv", yearStart: 2023 },
  { brand: "Renault", model: "Logan 1.6", vehicleType: "car", segment: "sedan", yearStart: 2016, yearEnd: 2022 },
  { brand: "Renault", model: "Sandero Stepway 1.6", vehicleType: "car", segment: "hatch", yearStart: 2016, yearEnd: 2022 },
  { brand: "Renault", model: "Duster 1.3 Turbo", vehicleType: "car", segment: "suv", yearStart: 2021 },
  { brand: "Renault", model: "Oroch 1.3 Turbo", vehicleType: "car", segment: "picape", yearStart: 2023 },
  { brand: "Renault", model: "Captur 1.3 Turbo", vehicleType: "car", segment: "suv", yearStart: 2021, yearEnd: 2024 },
  { brand: "Renault", model: "Kwid Outsider 1.0", vehicleType: "car", segment: "hatch", yearStart: 2020 },
  { brand: "Nissan", model: "March 1.6", vehicleType: "car", segment: "hatch", yearStart: 2016, yearEnd: 2021 },
  { brand: "Nissan", model: "Versa V-Drive 1.6", vehicleType: "car", segment: "sedan", yearStart: 2021 },
  { brand: "Nissan", model: "Sentra 2.0", vehicleType: "car", segment: "sedan", yearStart: 2023 },
  { brand: "Nissan", model: "Kicks 1.0 Turbo", vehicleType: "car", segment: "suv", yearStart: 2025 },
  { brand: "Nissan", model: "Frontier 2.3 Diesel", vehicleType: "car", segment: "picape", fuelType: "Diesel", yearStart: 2017 },
  { brand: "Jeep", model: "Renegade 2.0 Diesel", vehicleType: "car", segment: "suv", fuelType: "Diesel", yearStart: 2016, yearEnd: 2021 },
  { brand: "Jeep", model: "Compass 2.0 Diesel", vehicleType: "car", segment: "suv", fuelType: "Diesel", yearStart: 2017, yearEnd: 2024 },
  { brand: "Jeep", model: "Commander 2.0 Diesel", vehicleType: "car", segment: "premium", fuelType: "Diesel", yearStart: 2022 },
  { brand: "Peugeot", model: "208 1.6", vehicleType: "car", segment: "hatch", yearStart: 2016, yearEnd: 2024 },
  { brand: "Peugeot", model: "2008 1.6 Turbo", vehicleType: "car", segment: "suv", yearStart: 2020 },
  { brand: "Peugeot", model: "3008 1.6 Turbo", vehicleType: "car", segment: "suv", yearStart: 2018, yearEnd: 2024 },
  { brand: "Citroën", model: "C4 Cactus 1.6 Turbo", vehicleType: "car", segment: "suv", yearStart: 2019, yearEnd: 2024 },
  { brand: "Citroën", model: "Aircross 1.6", vehicleType: "car", segment: "crossover", yearStart: 2016, yearEnd: 2023 },
  { brand: "Ford", model: "EcoSport 1.5", vehicleType: "car", segment: "suv", yearStart: 2017, yearEnd: 2021 },
  { brand: "Ford", model: "Ka Sedan 1.5", vehicleType: "car", segment: "sedan", yearStart: 2016, yearEnd: 2021 },
  { brand: "Ford", model: "Ranger 2.0 Diesel", vehicleType: "car", segment: "picape", fuelType: "Diesel", yearStart: 2020 },
  { brand: "Ford", model: "Territory 1.5 Turbo", vehicleType: "car", segment: "suv", yearStart: 2021 },
  { brand: "Caoa Chery", model: "Tiggo 5X 1.5 Turbo", vehicleType: "car", segment: "suv", yearStart: 2019 },
  { brand: "Caoa Chery", model: "Tiggo 7 Pro 1.6 Turbo", vehicleType: "car", segment: "suv", yearStart: 2022 },
  { brand: "Caoa Chery", model: "Tiggo 8 1.6 Turbo", vehicleType: "car", segment: "premium", yearStart: 2021 },
  { brand: "RAM", model: "Rampage 2.0 Diesel", vehicleType: "car", segment: "picape", fuelType: "Diesel", yearStart: 2024 },
];

const additionalMotoCoverageModels: VehicleCatalogCoverageModel[] = [
  { brand: "Honda", model: "CG 160 Titan", vehicleType: "motorcycle", segment: "street", fuelType: "Flex", yearStart: 2016 },
  { brand: "Honda", model: "CG 160 Fan", vehicleType: "motorcycle", segment: "street", fuelType: "Flex", yearStart: 2016 },
  { brand: "Honda", model: "NXR Bros 160 ESDD", vehicleType: "motorcycle", segment: "trail", fuelType: "Flex", yearStart: 2016 },
  { brand: "Honda", model: "XRE 190", vehicleType: "motorcycle", segment: "trail", fuelType: "Flex", yearStart: 2016 },
  { brand: "Honda", model: "CB 500F", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2016 },
  { brand: "Honda", model: "CB 500X", vehicleType: "motorcycle", segment: "trail", fuelType: "Gasolina", yearStart: 2016, yearEnd: 2023 },
  { brand: "Honda", model: "CB 650R", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2019 },
  { brand: "Honda", model: "CBR 650R", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2019 },
  { brand: "Honda", model: "NC 750X", vehicleType: "motorcycle", segment: "touring", fuelType: "Gasolina", yearStart: 2016 },
  { brand: "Honda", model: "Africa Twin 1100", vehicleType: "motorcycle", segment: "big-trail", fuelType: "Gasolina", yearStart: 2020 },
  { brand: "Honda", model: "Elite 125", vehicleType: "motorcycle", segment: "scooter", fuelType: "Gasolina", yearStart: 2019 },
  { brand: "Honda", model: "PCX 150", vehicleType: "motorcycle", segment: "scooter", fuelType: "Gasolina", yearStart: 2016, yearEnd: 2021 },
  { brand: "Honda", model: "ADV 160", vehicleType: "motorcycle", segment: "scooter", fuelType: "Gasolina", yearStart: 2023 },
  { brand: "Honda", model: "SH 150i", vehicleType: "motorcycle", segment: "scooter", fuelType: "Gasolina", yearStart: 2016, yearEnd: 2022 },
  { brand: "Yamaha", model: "FZ15", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2023 },
  { brand: "Yamaha", model: "FZ25", vehicleType: "motorcycle", segment: "street", fuelType: "Flex", yearStart: 2018 },
  { brand: "Yamaha", model: "Fazer 250 Connected", vehicleType: "motorcycle", segment: "street", fuelType: "Flex", yearStart: 2025 },
  { brand: "Yamaha", model: "Crosser 150 S", vehicleType: "motorcycle", segment: "trail", fuelType: "Flex", yearStart: 2019 },
  { brand: "Yamaha", model: "Lander 250 ABS", vehicleType: "motorcycle", segment: "trail", fuelType: "Flex", yearStart: 2020 },
  { brand: "Yamaha", model: "MT-07", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2016 },
  { brand: "Yamaha", model: "MT-09", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2016 },
  { brand: "Yamaha", model: "R15", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2023 },
  { brand: "Yamaha", model: "YZF-R3", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2016 },
  { brand: "Yamaha", model: "NMAX 160", vehicleType: "motorcycle", segment: "scooter", fuelType: "Gasolina", yearStart: 2017 },
  { brand: "Yamaha", model: "Neo 125", vehicleType: "motorcycle", segment: "scooter", fuelType: "Gasolina", yearStart: 2017 },
  { brand: "Yamaha", model: "XMAX 250", vehicleType: "motorcycle", segment: "scooter", fuelType: "Gasolina", yearStart: 2018 },
  { brand: "Kawasaki", model: "Ninja 300", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2016, yearEnd: 2017 },
  { brand: "Kawasaki", model: "Ninja 400", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2018 },
  { brand: "Kawasaki", model: "Z400", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2019 },
  { brand: "Kawasaki", model: "Z650", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2018 },
  { brand: "Kawasaki", model: "Z900", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2018 },
  { brand: "Kawasaki", model: "Versys-X 300", vehicleType: "motorcycle", segment: "trail", fuelType: "Gasolina", yearStart: 2018 },
  { brand: "Kawasaki", model: "Versys 650", vehicleType: "motorcycle", segment: "touring", fuelType: "Gasolina", yearStart: 2017 },
  { brand: "Kawasaki", model: "Vulcan S 650", vehicleType: "motorcycle", segment: "custom", fuelType: "Gasolina", yearStart: 2017 },
  { brand: "Suzuki", model: "Gixxer 150", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2016, yearEnd: 2024 },
  { brand: "Suzuki", model: "GSX-S750", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2018, yearEnd: 2024 },
  { brand: "Suzuki", model: "V-Strom 650XT", vehicleType: "motorcycle", segment: "touring", fuelType: "Gasolina", yearStart: 2016, yearEnd: 2024 },
  { brand: "Suzuki", model: "V-Strom 1050", vehicleType: "motorcycle", segment: "big-trail", fuelType: "Gasolina", yearStart: 2021 },
  { brand: "Suzuki", model: "Burgman 125", vehicleType: "motorcycle", segment: "scooter", fuelType: "Gasolina", yearStart: 2018 },
  { brand: "Haojue", model: "DK 160", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2020 },
  { brand: "Haojue", model: "DR 160", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2020 },
  { brand: "Haojue", model: "Lindy 125", vehicleType: "motorcycle", segment: "scooter", fuelType: "Gasolina", yearStart: 2021 },
  { brand: "BMW", model: "F 750 GS", vehicleType: "motorcycle", segment: "big-trail", fuelType: "Gasolina", yearStart: 2019 },
  { brand: "BMW", model: "F 900 GS", vehicleType: "motorcycle", segment: "big-trail", fuelType: "Gasolina", yearStart: 2024 },
  { brand: "BMW", model: "F 900 R", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2022 },
  { brand: "BMW", model: "R 1250 GS", vehicleType: "motorcycle", segment: "big-trail", fuelType: "Gasolina", yearStart: 2019 },
  { brand: "BMW", model: "S 1000 RR", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2016 },
  { brand: "BMW", model: "C 400 X", vehicleType: "motorcycle", segment: "scooter", fuelType: "Gasolina", yearStart: 2022 },
  { brand: "Royal Enfield", model: "Himalayan 411", vehicleType: "motorcycle", segment: "trail", fuelType: "Gasolina", yearStart: 2019, yearEnd: 2024 },
  { brand: "Royal Enfield", model: "Scram 411", vehicleType: "motorcycle", segment: "trail", fuelType: "Gasolina", yearStart: 2023 },
  { brand: "Royal Enfield", model: "Classic 350", vehicleType: "motorcycle", segment: "custom", fuelType: "Gasolina", yearStart: 2022 },
  { brand: "Royal Enfield", model: "Meteor 350", vehicleType: "motorcycle", segment: "custom", fuelType: "Gasolina", yearStart: 2021 },
  { brand: "Royal Enfield", model: "Hunter 350", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2023 },
  { brand: "Royal Enfield", model: "Interceptor 650", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2019 },
  { brand: "Royal Enfield", model: "Continental GT 650", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2019 },
  { brand: "Royal Enfield", model: "Super Meteor 650", vehicleType: "motorcycle", segment: "custom", fuelType: "Gasolina", yearStart: 2024 },
  { brand: "Bajaj", model: "Dominar 160", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2024 },
  { brand: "Bajaj", model: "Dominar 200", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2024 },
  { brand: "Bajaj", model: "Dominar 400", vehicleType: "motorcycle", segment: "touring", fuelType: "Gasolina", yearStart: 2024 },
  { brand: "Bajaj", model: "Pulsar N160", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2023 },
  { brand: "Bajaj", model: "Pulsar NS200", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2023 },
  { brand: "Bajaj", model: "Pulsar F250", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2024 },
  { brand: "Triumph", model: "Speed 400", vehicleType: "motorcycle", segment: "street", fuelType: "Gasolina", yearStart: 2024 },
  { brand: "Triumph", model: "Scrambler 400 X", vehicleType: "motorcycle", segment: "trail", fuelType: "Gasolina", yearStart: 2024 },
  { brand: "Triumph", model: "Tiger 900", vehicleType: "motorcycle", segment: "big-trail", fuelType: "Gasolina", yearStart: 2020 },
  { brand: "Triumph", model: "Trident 660", vehicleType: "motorcycle", segment: "sport", fuelType: "Gasolina", yearStart: 2022 },
  { brand: "Dafra", model: "Citycom 300i", vehicleType: "motorcycle", segment: "scooter", fuelType: "Gasolina", yearStart: 2016, yearEnd: 2024 },
  { brand: "Dafra", model: "NH 190", vehicleType: "motorcycle", segment: "trail", fuelType: "Gasolina", yearStart: 2020, yearEnd: 2024 },
];

function dedupeVehiclePresetSeeds(seedOptions: VehiclePresetOption[]) {
  const seen = new Set<string>();
  return seedOptions.filter((option) => {
    if (seen.has(option.id)) {
      return false;
    }
    seen.add(option.id);
    return true;
  });
}

const coreModelKeys = new Set(
  coreVehiclePresetSeedOptions.map((seed) =>
    toCoverageModelKey({
      brand: seed.brand,
      model: seed.model,
      vehicleType: seed.vehicleType,
    }),
  ),
);

const additionalVehicleCoverageSeedOptions = [
  ...additionalCarCoverageModels,
  ...additionalMotoCoverageModels,
]
  .filter((model) => !coreModelKeys.has(toCoverageModelKey(model)))
  .map(buildCoveragePreset);

const vehiclePresetSeedOptions = dedupeVehiclePresetSeeds([
  ...coreVehiclePresetSeedOptions,
  ...additionalVehicleCoverageSeedOptions,
]);

const generatedVehiclePresetOptions = buildLargeVehiclePresetCatalog();

export const vehiclePresetOptions: VehiclePresetOption[] = [
  ...vehiclePresetSeedOptions,
  ...generatedVehiclePresetOptions,
];

const vehiclePresetMaintenanceOverrides: Record<string, VehicleMaintenanceReference[]> = {
  "cg-160": [
    ...motorcycleMaintenanceReferences,
    {
      id: "cg160-injecao",
      label: "Limpeza de TBI e injeção",
      category: "eletrica",
      recommendedKmInterval: 12000,
      recommendedMonthsInterval: 12,
      estimatedCostMin: 90,
      estimatedCostMax: 240,
      typicalParts: ["Limpeza de bico", "Regulagem de marcha lenta", "Scanner"],
    },
  ],
  "prisma-1-0-2015": [
    ...carMaintenanceReferences,
    {
      id: "prisma-suspensao",
      label: "Kit suspensão dianteira",
      category: "outros",
      recommendedKmInterval: 35000,
      recommendedMonthsInterval: 24,
      estimatedCostMin: 480,
      estimatedCostMax: 1450,
      typicalParts: ["Amortecedores", "Batente", "Coxim", "Bieleta"],
    },
  ],
  "gol-1-5-2016": [
    ...carMaintenanceReferences,
    {
      id: "gol-correia-acessorios",
      label: "Correia de acessórios",
      category: "outros",
      recommendedKmInterval: 40000,
      recommendedMonthsInterval: 24,
      estimatedCostMin: 220,
      estimatedCostMax: 740,
      typicalParts: ["Correia", "Tensor", "Mão de obra"],
    },
  ],
  "bmw-g310gs": [
    ...motorcycleMaintenanceReferences,
    {
      id: "bmw-g310-kit-revisao",
      label: "Revisão premium G 310",
      category: "revisao",
      recommendedKmInterval: 10000,
      recommendedMonthsInterval: 12,
      estimatedCostMin: 480,
      estimatedCostMax: 1280,
      typicalParts: ["Óleo sintético", "Filtro de óleo BMW", "Filtro de ar", "Diagnóstico eletrônico"],
    },
  ],
  "bmw-g310r": [
    ...motorcycleMaintenanceReferences,
    {
      id: "bmw-g310r-freio",
      label: "Freios e fluido DOT4",
      category: "freio",
      recommendedKmInterval: 12000,
      recommendedMonthsInterval: 12,
      estimatedCostMin: 260,
      estimatedCostMax: 760,
      typicalParts: ["Pastilhas dianteiras/traseiras", "Fluido DOT4", "Mão de obra"],
    },
  ],
  "bmw-f850gs": [
    ...motorcycleMaintenanceReferences,
    {
      id: "bmw-f850-transmissao",
      label: "Transmissão e revisão completa",
      category: "revisao",
      recommendedKmInterval: 10000,
      recommendedMonthsInterval: 12,
      estimatedCostMin: 1200,
      estimatedCostMax: 2900,
      typicalParts: ["Kit transmissão", "Óleo sintético premium", "Velas", "Filtro de ar"],
    },
  ],
  "s10-2-8-diesel": [
    ...carMaintenanceReferences,
    {
      id: "s10-filtro-diesel",
      label: "Filtro diesel e separador",
      category: "outros",
      recommendedKmInterval: 20000,
      recommendedMonthsInterval: 12,
      estimatedCostMin: 240,
      estimatedCostMax: 640,
      typicalParts: ["Filtro diesel", "Pré-filtro", "Mão de obra"],
    },
  ],
  "xre-300": [
    ...motorcycleMaintenanceReferences,
    {
      id: "xre-valvulas",
      label: "Ajuste de válvulas",
      category: "revisao",
      recommendedKmInterval: 12000,
      recommendedMonthsInterval: 12,
      estimatedCostMin: 180,
      estimatedCostMax: 460,
      typicalParts: ["Jogo de juntas", "Mão de obra especializada"],
    },
  ],
};

export function findVehiclePreset(brand: string, model: string, year: number) {
  const normalizedBrand = brand.trim().toLowerCase();
  const normalizedModel = model.trim().toLowerCase();

  return vehiclePresetOptions.find((preset) => {
    if (!normalizedBrand.includes(preset.brand.toLowerCase())) {
      return false;
    }
    if (!normalizedModel.includes(preset.model.toLowerCase().replace(/\s+/g, " "))) {
      return false;
    }
    return preset.years.includes(year);
  });
}

export function getVehiclePresetById(id?: string | null) {
  if (!id) {
    return undefined;
  }
  return vehiclePresetOptions.find((preset) => preset.id === id);
}

export function getVehicleMaintenanceReferences(params?: {
  presetId?: string | null;
  vehicleType?: VehicleType | null;
}) {
  if (params?.presetId && vehiclePresetMaintenanceOverrides[params.presetId]) {
    return vehiclePresetMaintenanceOverrides[params.presetId];
  }

  const inferredType =
    params?.vehicleType ??
    (params?.presetId ? getVehiclePresetById(params.presetId)?.vehicleType : null) ??
    "motorcycle";

  return inferredType === "car" ? carMaintenanceReferences : motorcycleMaintenanceReferences;
}

export const vehiclePresetYearOptions = yearRange(2016, 2026);

function getFuelReferencePriceByType(fuelType: string) {
  const normalized = fuelType.trim().toLowerCase();
  if (normalized.includes("diesel")) {
    return 6.05;
  }
  if (normalized.includes("etanol")) {
    return 4.2;
  }
  return 6.2;
}

function estimateMaintenanceAnnualCost(
  references: VehicleMaintenanceReference[],
  annualKm: number,
) {
  return references.reduce((sum, reference) => {
    const midpoint = (reference.estimatedCostMin + reference.estimatedCostMax) / 2;
    if (!reference.recommendedKmInterval && !reference.recommendedMonthsInterval) {
      return sum + midpoint;
    }

    const byKm =
      reference.recommendedKmInterval && reference.recommendedKmInterval > 0
        ? annualKm / reference.recommendedKmInterval
        : 0;
    const byMonths =
      reference.recommendedMonthsInterval && reference.recommendedMonthsInterval > 0
        ? 12 / reference.recommendedMonthsInterval
        : 0;
    const annualOccurrences = Math.max(byKm, byMonths, 0.25);
    return sum + midpoint * annualOccurrences;
  }, 0);
}

export function estimateVehiclePresetCostProfile(
  preset: VehiclePresetOption,
  options?: {
    annualKm?: number;
    fuelPricePerLiter?: number;
  },
): VehiclePresetCostProfile {
  const annualKm = options?.annualKm ?? (preset.vehicleType === "car" ? 12000 : 9000);
  const fuelPricePerLiter = options?.fuelPricePerLiter ?? getFuelReferencePriceByType(preset.fuelType);
  const averageKmPerLiter = preset.averageCityKmPerLiter || preset.averageHighwayKmPerLiter || 1;
  const annualFuelCost = (annualKm / averageKmPerLiter) * fuelPricePerLiter;
  const maintenanceAnnualCost = estimateMaintenanceAnnualCost(
    getVehicleMaintenanceReferences({ presetId: preset.id, vehicleType: preset.vehicleType }),
    annualKm,
  );
  const annualFixedCost = Object.values(preset.fixedCosts).reduce(
    (sum, rule) => sum + (rule.enabled ? rule.amount : 0),
    0,
  );
  const annualTotalCost = annualFuelCost + maintenanceAnnualCost + annualFixedCost;

  return {
    presetId: preset.id,
    annualKm,
    fuelPricePerLiter,
    annualFuelCost,
    annualMaintenanceCost: maintenanceAnnualCost,
    annualFixedCost,
    annualTotalCost,
    fuelCostPerKm: annualFuelCost / annualKm,
    maintenanceCostPerKm: maintenanceAnnualCost / annualKm,
    fixedCostPerKm: annualFixedCost / annualKm,
    totalCostPerKm: annualTotalCost / annualKm,
  };
}

export function getVehiclePresetOptions(params?: {
  vehicleType?: VehicleType | "all";
  year?: number | "all";
  query?: string;
}) {
  const vehicleType = params?.vehicleType ?? "all";
  const year = params?.year ?? "all";
  const query = params?.query?.trim().toLowerCase();

  return vehiclePresetOptions
    .filter((preset) => (vehicleType === "all" ? true : preset.vehicleType === vehicleType))
    .filter((preset) => (year === "all" ? true : preset.years.includes(year)))
    .filter((preset) => {
      if (!query) {
        return true;
      }
      const searchable = `${preset.label} ${preset.brand} ${preset.model} ${preset.engineLabel ?? ""}`.toLowerCase();
      return searchable.includes(query);
    })
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export const supplyCategoryOptions = [
  "Tinta",
  "Primer branco",
  "Verniz",
  "Lixa",
  "Fita",
  "Pincel",
  "Solvente",
  "Cola",
  "Embalagem",
  "Mantimentos gerais",
  "Outros",
] as const;

export const iconOptions = [
  "wallet",
  "heart-handshake",
  "home",
  "cigarette",
  "leaf",
  "wine",
  "utensils",
  "shopping-cart",
  "car",
  "receipt",
  "pill",
  "sparkles",
  "badge-dollar-sign",
  "gift",
  "paw-print",
  "heart-pulse",
  "circle-ellipsis",
  "credit-card",
  "banknote",
  "briefcase-business",
  "fuel",
  "wrench",
  "bike",
  "printer",
  "paintbrush",
  "package",
  "package-2",
  "store",
  "zap",
  "file-text",
] as const;

export const colorOptions = [
  "#10b981",
  "#06b6d4",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#64748b",
  "#facc15",
  "#34d399",
];
