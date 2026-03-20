import { addDays } from "date-fns";

import { formatMonthKey, roundCurrency } from "@/lib/utils";
import type { ProductionJob, StoreOrder, WorkspaceSnapshot } from "@/types/domain";

export type CatalogCategory =
  | "decoracao"
  | "geek"
  | "anime"
  | "organizacao"
  | "presentes"
  | "automotivo"
  | "pets"
  | "utilitarios";

export interface CatalogTemplate {
  id: string;
  name: string;
  category: CatalogCategory;
  theme: string;
  keywords: string[];
  description: string;
  primaryMaterial: string;
  estimatedPrintHours: number;
  basePricePix: number;
  basePriceCard: number;
  baseUnitCost: number;
  tags: string[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  category: CatalogCategory;
  theme: string;
  description: string;
  tags: string[];
  pricePix: number;
  priceCard: number;
  unitCost: number;
  marginPercent: number;
  soldQuantity: number;
  openOrders: number;
  avgLeadDays: number;
  stockRisk: "low" | "medium" | "high";
  stockHint: string;
  popularityScore: number;
  customizable: boolean;
}

export interface CatalogCartItem {
  productId: string;
  name: string;
  unitPricePix: number;
  unitPriceCard: number;
  quantity: number;
}

export interface CatalogOverview {
  productCount: number;
  averageMargin: number;
  monthlyDemand: number;
  openOrders: number;
  stockRiskCount: number;
  projectedPixRevenue: number;
  projectedCardRevenue: number;
}

const catalogTemplates: CatalogTemplate[] = [
  {
    id: "cat-anime-busto",
    name: "Busto Anime Premium",
    category: "anime",
    theme: "Anime",
    keywords: ["anime", "busto", "otaku", "naruto", "dragon", "demon"],
    description: "Peça de coleção com acabamento premium para setup ou estante.",
    primaryMaterial: "PLA",
    estimatedPrintHours: 9,
    basePricePix: 95,
    basePriceCard: 109,
    baseUnitCost: 38,
    tags: ["colecionável", "alto detalhe", "presente"],
  },
  {
    id: "cat-geek-logo-lamp",
    name: "Luminária Geek Personalizada",
    category: "geek",
    theme: "Geek",
    keywords: ["luminaria", "geek", "logo", "gamer", "led"],
    description: "Luminária temática com nome ou personagem para quarto gamer.",
    primaryMaterial: "PLA",
    estimatedPrintHours: 7,
    basePricePix: 84,
    basePriceCard: 96,
    baseUnitCost: 33,
    tags: ["personalizável", "gamer", "decoração"],
  },
  {
    id: "cat-vaso-organico",
    name: "Vaso Orgânico Moderno",
    category: "decoracao",
    theme: "Casa",
    keywords: ["vaso", "decoracao", "organico", "casa", "sala"],
    description: "Vaso com textura moderna para compor decoração de ambientes.",
    primaryMaterial: "PLA",
    estimatedPrintHours: 6,
    basePricePix: 56,
    basePriceCard: 64,
    baseUnitCost: 21,
    tags: ["decor", "casa", "linha clean"],
  },
  {
    id: "cat-organizador-mesa",
    name: "Organizador de Mesa Modular",
    category: "organizacao",
    theme: "Escritório",
    keywords: ["organizador", "mesa", "modular", "escritorio", "setup"],
    description: "Módulos combináveis para organizar mesa de trabalho e estudo.",
    primaryMaterial: "PLA",
    estimatedPrintHours: 5,
    basePricePix: 52,
    basePriceCard: 60,
    baseUnitCost: 18,
    tags: ["produtividade", "modular", "setup"],
  },
  {
    id: "cat-suporte-controle",
    name: "Suporte de Controle e Headset",
    category: "geek",
    theme: "Gamer",
    keywords: ["suporte", "controle", "headset", "gamer", "xbox", "ps5"],
    description: "Suporte robusto para controle e headset com design gamer.",
    primaryMaterial: "PETG",
    estimatedPrintHours: 4,
    basePricePix: 48,
    basePriceCard: 55,
    baseUnitCost: 16,
    tags: ["gamer", "resistente", "utilitário"],
  },
  {
    id: "cat-porta-chave-parede",
    name: "Porta-Chaves de Parede",
    category: "utilitarios",
    theme: "Casa",
    keywords: ["porta-chave", "chave", "parede", "entrada", "casa"],
    description: "Organizador de chaves com gancho e opção de nome da família.",
    primaryMaterial: "PLA",
    estimatedPrintHours: 3.5,
    basePricePix: 42,
    basePriceCard: 49,
    baseUnitCost: 15,
    tags: ["casa", "personalizável", "prático"],
  },
  {
    id: "cat-cofre-tematico",
    name: "Cofre Temático Infantil",
    category: "presentes",
    theme: "Infantil",
    keywords: ["cofre", "infantil", "presente", "aniversario", "tema"],
    description: "Cofrinho divertido com tema e nome personalizado.",
    primaryMaterial: "PLA",
    estimatedPrintHours: 5,
    basePricePix: 58,
    basePriceCard: 67,
    baseUnitCost: 20,
    tags: ["presente", "personalizável", "infantil"],
  },
  {
    id: "cat-kit-escritorio",
    name: "Kit Escritório 3 Peças",
    category: "organizacao",
    theme: "Escritório",
    keywords: ["kit", "escritorio", "caneta", "organizador", "mesa"],
    description: "Kit com porta-canetas, clip holder e suporte para celular.",
    primaryMaterial: "PLA",
    estimatedPrintHours: 8,
    basePricePix: 89,
    basePriceCard: 102,
    baseUnitCost: 34,
    tags: ["kit", "produtividade", "home office"],
  },
  {
    id: "cat-pet-comedouro",
    name: "Suporte de Comedouro Pet",
    category: "pets",
    theme: "Pets",
    keywords: ["pet", "comedouro", "suporte", "cachorro", "gato"],
    description: "Suporte elevado para pote, com foco em conforto do pet.",
    primaryMaterial: "PETG",
    estimatedPrintHours: 6.5,
    basePricePix: 76,
    basePriceCard: 87,
    baseUnitCost: 29,
    tags: ["pets", "resistente", "bem-estar"],
  },
  {
    id: "cat-suporte-celular-carro",
    name: "Suporte de Celular Automotivo",
    category: "automotivo",
    theme: "Automóvel",
    keywords: ["suporte", "celular", "carro", "automotivo", "painel"],
    description: "Suporte ajustável para painel com fixação reforçada.",
    primaryMaterial: "PETG",
    estimatedPrintHours: 3,
    basePricePix: 39,
    basePriceCard: 46,
    baseUnitCost: 14,
    tags: ["automotivo", "utilitário", "rápido"],
  },
  {
    id: "cat-holder-cabos",
    name: "Holder de Cabos Magnético",
    category: "utilitarios",
    theme: "Setup",
    keywords: ["holder", "cabos", "setup", "mesa", "organizador"],
    description: "Peça compacta para manter cabos organizados no setup.",
    primaryMaterial: "PLA",
    estimatedPrintHours: 2.2,
    basePricePix: 28,
    basePriceCard: 34,
    baseUnitCost: 10,
    tags: ["setup", "baixo ticket", "upsell"],
  },
  {
    id: "cat-quadro-relevo",
    name: "Quadro em Relevo Personalizado",
    category: "decoracao",
    theme: "Personalizado",
    keywords: ["quadro", "relevo", "personalizado", "foto", "nome"],
    description: "Quadro com relevo e identidade visual personalizada.",
    primaryMaterial: "PLA",
    estimatedPrintHours: 10,
    basePricePix: 128,
    basePriceCard: 145,
    baseUnitCost: 52,
    tags: ["premium", "presente", "alto valor"],
  },
];

const openStatuses = new Set(["budget", "in-production", "ready"]);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesTemplate(value: string, template: CatalogTemplate) {
  const normalized = normalize(value);
  return template.keywords.some((keyword) => normalized.includes(normalize(keyword)));
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return roundCurrency(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function countMaterialStock(snapshot: WorkspaceSnapshot, material: string) {
  const normalizedMaterial = normalize(material);
  return snapshot.filamentSpools
    .filter((spool) => normalize(spool.material).includes(normalizedMaterial))
    .reduce((sum, spool) => sum + spool.remainingWeightGrams, 0);
}

function resolveStockRisk(snapshot: WorkspaceSnapshot, template: CatalogTemplate) {
  const availableGrams = countMaterialStock(snapshot, template.primaryMaterial);
  if (availableGrams < 500) {
    return {
      stockRisk: "high" as const,
      stockHint: "Estoque crítico para este material",
    };
  }

  if (availableGrams < 1200) {
    return {
      stockRisk: "medium" as const,
      stockHint: "Estoque moderado, planejar reposição",
    };
  }

  return {
    stockRisk: "low" as const,
    stockHint: "Estoque saudável para produção",
  };
}

function matchOrdersByTemplate(orders: StoreOrder[], template: CatalogTemplate) {
  return orders.filter((order) => matchesTemplate(order.productName, template));
}

function matchJobsByTemplate(jobs: ProductionJob[], template: CatalogTemplate) {
  return jobs.filter((job) => matchesTemplate(job.name, template));
}

export function buildCatalogProducts(
  snapshot: WorkspaceSnapshot,
  options?: {
    month?: string;
  },
) {
  const month = options?.month;
  const orders = snapshot.storeOrders.filter((order) =>
    month ? formatMonthKey(order.date) === month : true,
  );
  const jobs = snapshot.productionJobs.filter((job) =>
    month ? formatMonthKey(job.date) === month : true,
  );

  return catalogTemplates.map<CatalogProduct>((template) => {
    const matchedOrders = matchOrdersByTemplate(orders, template);
    const matchedJobs = matchJobsByTemplate(jobs, template);
    const deliveredOrders = matchedOrders.filter((order) => order.status === "delivered");
    const openOrders = matchedOrders.filter((order) => openStatuses.has(order.status)).length;
    const soldQuantity = deliveredOrders.reduce((sum, order) => sum + order.quantity, 0);
    const avgPixPrice = average(
      deliveredOrders.map((order) =>
        order.quantity ? order.totalPrice / order.quantity : template.basePricePix,
      ),
    );
    const avgCardPrice = roundCurrency(avgPixPrice * 1.12);
    const avgUnitCost = average([
      ...matchedJobs.map((job) => job.unitCost),
      ...deliveredOrders.map((order) =>
        order.quantity ? order.totalCostSnapshot / order.quantity : template.baseUnitCost,
      ),
    ]);
    const unitCost = avgUnitCost || template.baseUnitCost;
    const pricePix = avgPixPrice || template.basePricePix;
    const priceCard = avgCardPrice || template.basePriceCard;
    const marginPercent = pricePix > 0 ? roundCurrency(((pricePix - unitCost) / pricePix) * 100) : 0;
    const leadDays = average([
      ...matchedJobs.map((job) => Math.max(1, Math.round(job.printHours / 3))),
      ...matchedOrders.map((order) =>
        Math.max(
          1,
          Math.round(
            Math.abs(
              (new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          ),
        ),
      ),
    ]);
    const stock = resolveStockRisk(snapshot, template);
    const popularityScore = roundCurrency(
      soldQuantity * 2 +
        openOrders * 1.5 +
        (marginPercent > 35 ? 8 : 0) +
        (template.tags.includes("baixo ticket") ? 3 : 0),
    );
    const customizable = template.tags.includes("personalizável") || template.tags.includes("premium");

    return {
      id: template.id,
      name: template.name,
      category: template.category,
      theme: template.theme,
      description: template.description,
      tags: template.tags,
      pricePix,
      priceCard,
      unitCost,
      marginPercent,
      soldQuantity,
      openOrders,
      avgLeadDays: leadDays || Math.max(1, Math.round(template.estimatedPrintHours / 3)),
      stockRisk: stock.stockRisk,
      stockHint: stock.stockHint,
      popularityScore,
      customizable,
    };
  });
}

export function getCatalogOverview(products: CatalogProduct[]): CatalogOverview {
  const productCount = products.length;
  const averageMargin = average(products.map((product) => product.marginPercent));
  const monthlyDemand = products.reduce((sum, product) => sum + product.soldQuantity, 0);
  const openOrders = products.reduce((sum, product) => sum + product.openOrders, 0);
  const stockRiskCount = products.filter((product) => product.stockRisk !== "low").length;
  const projectedPixRevenue = roundCurrency(
    products.reduce(
      (sum, product) => sum + product.pricePix * Math.max(1, product.soldQuantity || product.openOrders || 1),
      0,
    ),
  );
  const projectedCardRevenue = roundCurrency(
    products.reduce(
      (sum, product) =>
        sum + product.priceCard * Math.max(1, product.soldQuantity || product.openOrders || 1),
      0,
    ),
  );

  return {
    productCount,
    averageMargin,
    monthlyDemand,
    openOrders,
    stockRiskCount,
    projectedPixRevenue,
    projectedCardRevenue,
  };
}

export function buildCatalogWhatsAppMessage(
  cart: CatalogCartItem[],
  options?: {
    customerName?: string;
  },
) {
  const subtotalPix = roundCurrency(
    cart.reduce((sum, item) => sum + item.unitPricePix * item.quantity, 0),
  );
  const subtotalCard = roundCurrency(
    cart.reduce((sum, item) => sum + item.unitPriceCard * item.quantity, 0),
  );
  const etaDate = addDays(new Date(), 5).toISOString().slice(0, 10);
  const lines = [
    "Olá, MDH 3D! Quero orçamento desses itens:",
    "",
    ...cart.map(
      (item, index) =>
        `${index + 1}. ${item.name} x${item.quantity} | Pix ${item.unitPricePix.toFixed(2)} | Cartão ${item.unitPriceCard.toFixed(2)}`,
    ),
    "",
    `Subtotal Pix: R$ ${subtotalPix.toFixed(2)}`,
    `Subtotal Cartão: R$ ${subtotalCard.toFixed(2)}`,
    `Entrega estimada inicial: ${etaDate}`,
  ];

  if (options?.customerName?.trim()) {
    lines.splice(1, 0, `Cliente: ${options.customerName.trim()}`);
  }

  return lines.join("\n");
}

export const catalogCategoryLabels: Record<CatalogCategory, string> = {
  decoracao: "Decoração",
  geek: "Geek",
  anime: "Anime",
  organizacao: "Organização",
  presentes: "Presentes",
  automotivo: "Automotivo",
  pets: "Pets",
  utilitarios: "Utilitários",
};
