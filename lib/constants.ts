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

export const vehiclePresetOptions = [
  {
    id: "cg-160",
    label: "Honda CG 160",
    vehicleType: "motorcycle" as const,
    brand: "Honda",
    model: "CG 160",
    fuelType: "Flex",
    averageCityKmPerLiter: 42,
    averageHighwayKmPerLiter: 45,
    tankCapacityLiters: 16,
    fixedCosts: {
      ipva: { enabled: true, amount: 220, dueMonth: 1, dueDay: 25 },
      insurance: { enabled: true, amount: 480, dueMonth: 6, dueDay: 10 },
      licensing: { enabled: true, amount: 180, dueMonth: 9, dueDay: 15 },
    },
    years: Array.from({ length: 11 }, (_, index) => 2016 + index),
  },
  {
    id: "prisma-1-0-2015",
    label: "Prisma 1.0 2015",
    vehicleType: "car" as const,
    brand: "Chevrolet",
    model: "Prisma 1.0",
    fuelType: "Flex",
    averageCityKmPerLiter: 12.2,
    averageHighwayKmPerLiter: 15.2,
    tankCapacityLiters: 54,
    fixedCosts: {
      ipva: { enabled: true, amount: 1100, dueMonth: 1, dueDay: 25 },
      insurance: { enabled: true, amount: 1900, dueMonth: 6, dueDay: 10 },
      licensing: { enabled: true, amount: 180, dueMonth: 9, dueDay: 15 },
    },
    years: [2015],
  },
  {
    id: "gol-1-5-2016",
    label: "Gol 1.5 2016",
    vehicleType: "car" as const,
    brand: "Volkswagen",
    model: "Gol 1.5",
    fuelType: "Flex",
    averageCityKmPerLiter: 11.2,
    averageHighwayKmPerLiter: 14.1,
    tankCapacityLiters: 55,
    fixedCosts: {
      ipva: { enabled: true, amount: 1250, dueMonth: 1, dueDay: 25 },
      insurance: { enabled: true, amount: 2100, dueMonth: 6, dueDay: 10 },
      licensing: { enabled: true, amount: 180, dueMonth: 9, dueDay: 15 },
    },
    years: [2016],
  },
] as const;

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
