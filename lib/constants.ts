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

export const vehiclePresetOptions: VehiclePresetOption[] = [
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
    fuelType: "Flex",
    averageCityKmPerLiter: 9.7,
    averageHighwayKmPerLiter: 11.9,
    tankCapacityLiters: 53,
    fixedCosts: buildFixedCosts(1850, 3400),
    years: yearRange(2016),
  },
];

const vehiclePresetMaintenanceOverrides: Record<string, VehicleMaintenanceReference[]> = {
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
