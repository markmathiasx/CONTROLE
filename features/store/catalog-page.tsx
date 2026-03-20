"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  BadgeDollarSign,
  Boxes,
  Check,
  Filter,
  HandCoins,
  PackageSearch,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { MonthSwitcher } from "@/components/shared/month-switcher";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { SummaryCard } from "@/components/shared/summary-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatCurrencyBRL } from "@/lib/formatters";
import { mergeSearchParams } from "@/lib/utils";
import { useFinanceStore } from "@/store/use-finance-store";
import { useCatalogCart } from "@/hooks/use-catalog-cart";
import {
  buildCatalogProducts,
  buildCatalogWhatsAppMessage,
  catalogCategoryLabels,
  getCatalogOverview,
  type CatalogProduct,
} from "@/utils/catalog";

type SortOption = "featured" | "price-asc" | "price-desc" | "margin-desc" | "demand-desc";
type RiskFilter = "all" | "low" | "medium" | "high";

function riskBadgeVariant(risk: CatalogProduct["stockRisk"]) {
  if (risk === "high") {
    return "danger" as const;
  }

  if (risk === "medium") {
    return "warning" as const;
  }

  return "default" as const;
}

function themeClass(name: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("anime")) {
    return "from-fuchsia-500/25 via-violet-500/12 to-transparent";
  }
  if (normalized.includes("geek") || normalized.includes("gamer")) {
    return "from-cyan-500/25 via-sky-500/12 to-transparent";
  }
  if (normalized.includes("casa") || normalized.includes("decor")) {
    return "from-emerald-500/25 via-teal-500/12 to-transparent";
  }
  if (normalized.includes("autom")) {
    return "from-amber-500/25 via-orange-500/12 to-transparent";
  }
  return "from-zinc-400/20 via-zinc-500/10 to-transparent";
}

export function CatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const snapshot = useFinanceStore((state) => state.snapshot);
  const initialized = useFinanceStore((state) => state.initialized);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const cart = useCatalogCart();
  const [selectedProduct, setSelectedProduct] = React.useState<CatalogProduct | null>(null);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [customerName, setCustomerName] = React.useState("");
  const productPanelTimerRef = React.useRef<number | null>(null);
  const cartPanelTimerRef = React.useRef<number | null>(null);
  const [filters, setFilters] = React.useState(() => ({
    query: searchParams.get("q") ?? "",
    category: searchParams.get("categoria") ?? "all",
    stockRisk: (searchParams.get("risco") as RiskFilter | null) ?? "all",
    sort: (searchParams.get("sort") as SortOption | null) ?? "featured",
  }));

  const updateQuery = React.useCallback(
    (updates: Record<string, string | null>) => {
      const query = mergeSearchParams(searchParams, updates);
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  React.useEffect(() => {
    setFilters({
      query: searchParams.get("q") ?? "",
      category: searchParams.get("categoria") ?? "all",
      stockRisk: (searchParams.get("risco") as RiskFilter | null) ?? "all",
      sort: (searchParams.get("sort") as SortOption | null) ?? "featured",
    });
  }, [searchParams]);

  React.useEffect(
    () => () => {
      if (productPanelTimerRef.current) {
        window.clearTimeout(productPanelTimerRef.current);
      }
      if (cartPanelTimerRef.current) {
        window.clearTimeout(cartPanelTimerRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    setSelectedProduct(null);
    setCartOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!selectedProduct) {
      if (productPanelTimerRef.current) {
        window.clearTimeout(productPanelTimerRef.current);
      }
      return;
    }

    productPanelTimerRef.current = window.setTimeout(() => {
      setSelectedProduct(null);
      toast("Quick view recolhido automaticamente.");
    }, 20_000);

    return () => {
      if (productPanelTimerRef.current) {
        window.clearTimeout(productPanelTimerRef.current);
      }
    };
  }, [selectedProduct]);

  React.useEffect(() => {
    if (!cartOpen) {
      if (cartPanelTimerRef.current) {
        window.clearTimeout(cartPanelTimerRef.current);
      }
      return;
    }

    cartPanelTimerRef.current = window.setTimeout(() => {
      setCartOpen(false);
      toast("Carrinho recolhido automaticamente.");
    }, 28_000);

    return () => {
      if (cartPanelTimerRef.current) {
        window.clearTimeout(cartPanelTimerRef.current);
      }
    };
  }, [cartOpen]);

  React.useEffect(() => {
    if (!selectedProduct && !cartOpen) {
      return;
    }

    const closeByScroll = () => {
      setSelectedProduct(null);
      setCartOpen(false);
    };

    window.addEventListener("scroll", closeByScroll, true);
    return () => {
      window.removeEventListener("scroll", closeByScroll, true);
    };
  }, [cartOpen, selectedProduct]);

  if (!initialized || !snapshot) {
    return <PageSkeleton cards={6} rows={3} />;
  }

  const products = buildCatalogProducts(snapshot, { month: selectedMonth });
  const categories = Array.from(new Set(products.map((product) => product.category)));
  const filteredProducts = products
    .filter((product) =>
      filters.query
        ? `${product.name} ${product.theme} ${product.tags.join(" ")}`.toLowerCase().includes(filters.query.toLowerCase())
        : true,
    )
    .filter((product) => (filters.category === "all" ? true : product.category === filters.category))
    .filter((product) => (filters.stockRisk === "all" ? true : product.stockRisk === filters.stockRisk))
    .sort((left, right) => {
      if (filters.sort === "price-asc") {
        return left.pricePix - right.pricePix;
      }
      if (filters.sort === "price-desc") {
        return right.pricePix - left.pricePix;
      }
      if (filters.sort === "margin-desc") {
        return right.marginPercent - left.marginPercent;
      }
      if (filters.sort === "demand-desc") {
        return right.soldQuantity - left.soldQuantity;
      }

      return right.popularityScore - left.popularityScore;
    });
  const overview = getCatalogOverview(filteredProducts);

  function openWhatsAppCart() {
    if (!cart.items.length) {
      toast.error("Adicione pelo menos um item no carrinho.");
      return;
    }

    const message = buildCatalogWhatsAppMessage(cart.items, { customerName });
    const url = `https://wa.me/5521920137249?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function copyCartSummary() {
    if (!cart.items.length) {
      toast.error("Carrinho vazio.");
      return;
    }

    const message = buildCatalogWhatsAppMessage(cart.items, { customerName });
    navigator.clipboard
      .writeText(message)
      .then(() => toast.success("Resumo copiado para área de transferência."))
      .catch(() => toast.error("Não foi possível copiar o resumo agora."));
  }

  return (
    <div className="aurora-hero space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="muted">Catálogo da loja</Badge>
            <Badge variant="default">
              <Sparkles className="mr-1 size-3.5" />
              Curadoria dinâmica
            </Badge>
          </div>
          <h1 className="font-heading text-3xl font-semibold text-zinc-50">
            Catálogo pronto para vender, com preço e margem já calibrados.
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-zinc-400">
            Produtos diferentes por tema, filtro rápido, quick view, carrinho persistente e
            transição direta para pedido interno ou atendimento no WhatsApp.
          </p>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={PackageSearch}
          label="Produtos ativos"
          value={`${overview.productCount}`}
          detail={`${overview.stockRiskCount} com atenção de estoque`}
        />
        <SummaryCard
          icon={BadgeDollarSign}
          label="Margem média"
          value={`${overview.averageMargin}%`}
          detail={`${overview.monthlyDemand} itens vendidos no período`}
          accent="from-cyan-400/20 via-cyan-500/10 to-transparent"
        />
        <SummaryCard
          icon={HandCoins}
          label="Potencial Pix"
          value={formatCurrencyBRL(overview.projectedPixRevenue)}
          detail={`Cartão: ${formatCurrencyBRL(overview.projectedCardRevenue)}`}
          accent="from-emerald-400/20 via-emerald-500/10 to-transparent"
        />
        <SummaryCard
          icon={Truck}
          label="Pedidos em andamento"
          value={`${overview.openOrders}`}
          detail="Demandas abertas pelo catálogo"
          accent="from-violet-400/20 via-violet-500/10 to-transparent"
        />
      </div>

      <Card className="glass-panel premium-hover">
        <CardHeader>
          <CardTitle>Filtros e ordenação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <Label>Busca</Label>
            <Input
              value={filters.query}
              placeholder="Anime, organizador, presente..."
              onChange={(event) => {
                const next = event.target.value;
                setFilters((current) => ({ ...current, query: next }));
                updateQuery({ q: next || null });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => {
                setFilters((current) => ({ ...current, category: value }));
                updateQuery({ categoria: value === "all" ? null : value });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {catalogCategoryLabels[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Risco de estoque</Label>
            <Select
              value={filters.stockRisk}
              onValueChange={(value) => {
                const next = value as RiskFilter;
                setFilters((current) => ({ ...current, stockRisk: next }));
                updateQuery({ risco: next === "all" ? null : next });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ordenar por</Label>
            <Select
              value={filters.sort}
              onValueChange={(value) => {
                const next = value as SortOption;
                setFilters((current) => ({ ...current, sort: next }));
                updateQuery({ sort: next === "featured" ? null : next });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Destaques</SelectItem>
                <SelectItem value="margin-desc">Maior margem</SelectItem>
                <SelectItem value="demand-desc">Mais vendidos</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="xl:col-span-3">
            <p className="flex items-center gap-2 text-xs text-zinc-500">
              <Filter className="size-3.5" />
              {filteredProducts.length} produto(s) após os filtros.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  filters.category === "all"
                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                    : "border-white/10 bg-white/6 text-zinc-400"
                }`}
                onClick={() => {
                  setFilters((current) => ({ ...current, category: "all" }));
                  updateQuery({ categoria: null });
                }}
              >
                Todos
              </button>
              {categories.slice(0, 6).map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    filters.category === category
                      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-white/6 text-zinc-400"
                  }`}
                  onClick={() => {
                    setFilters((current) => ({ ...current, category }));
                    updateQuery({ categoria: category });
                  }}
                >
                  {catalogCategoryLabels[category]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-2xl"
              onClick={() => {
                setFilters({
                  query: "",
                  category: "all",
                  stockRisk: "all",
                  sort: "featured",
                });
                updateQuery({
                  q: null,
                  categoria: null,
                  risco: null,
                  sort: null,
                });
              }}
            >
              <ArrowUpDown className="size-4" />
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredProducts.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="glass-panel premium-hover overflow-hidden">
              <CardContent className="p-0">
                <div className={`h-28 bg-gradient-to-br ${themeClass(product.theme)} p-4`}>
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="muted">{catalogCategoryLabels[product.category]}</Badge>
                    <Badge variant={riskBadgeVariant(product.stockRisk)}>
                      {product.stockRisk === "high"
                        ? "Estoque crítico"
                        : product.stockRisk === "medium"
                          ? "Reposição próxima"
                          : "Estoque ok"}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm text-zinc-200">{product.theme}</p>
                </div>

                <div className="space-y-4 p-4">
                  <div className="space-y-2">
                    <h2 className="font-heading text-xl font-semibold text-zinc-50">{product.name}</h2>
                    <p className="text-sm text-zinc-400">{product.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="muted">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/6 p-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Pix</p>
                      <p className="mt-1 font-semibold text-zinc-50">{formatCurrencyBRL(product.pricePix)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Cartão</p>
                      <p className="mt-1 font-semibold text-zinc-50">{formatCurrencyBRL(product.priceCard)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Margem</p>
                      <p className={`mt-1 font-semibold ${product.marginPercent >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        {product.marginPercent}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Prazo médio</p>
                      <p className="mt-1 font-semibold text-zinc-50">{product.avgLeadDays} dia(s)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-zinc-400">
                    <p>Vendidos: <span className="font-medium text-zinc-200">{product.soldQuantity}</span></p>
                    <p>Abertos: <span className="font-medium text-zinc-200">{product.openOrders}</span></p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="flex-1 rounded-2xl"
                      onClick={() => {
                        cart.addProduct(product);
                        toast.success(`${product.name} adicionado no carrinho.`);
                      }}
                    >
                      <ShoppingCart className="size-4" />
                      Adicionar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1 rounded-2xl"
                      onClick={() => setSelectedProduct(product)}
                    >
                      Quick view
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title="Nenhum produto encontrado"
          description="Ajuste os filtros para voltar a visualizar itens do catálogo."
        />
      )}

      <Card className="glass-panel premium-hover">
        <CardHeader>
          <CardTitle>Ações rápidas do catálogo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Button asChild variant="secondary" className="justify-between rounded-2xl">
            <Link href="/loja/estoque">
              Repor estoque
              <Boxes className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" className="justify-between rounded-2xl">
            <Link href="/loja/producao">
              Planejar produção
              <Truck className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" className="justify-between rounded-2xl">
            <Link href="/loja/pedidos">
              Abrir pedidos
              <ShoppingCart className="size-4" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="justify-between rounded-2xl"
            onClick={() => setCartOpen(true)}
          >
            Ver carrinho
            <Badge variant="default">{cart.totals.quantity}</Badge>
          </Button>
        </CardContent>
      </Card>

      <Sheet open={Boolean(selectedProduct)} onOpenChange={(open) => (!open ? setSelectedProduct(null) : null)}>
        {selectedProduct ? (
          <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedProduct.name}</SheetTitle>
              <SheetDescription>
                {selectedProduct.description} Este painel recolhe automaticamente após alguns segundos.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4">
              <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${themeClass(selectedProduct.theme)} p-4`}>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="muted">{catalogCategoryLabels[selectedProduct.category]}</Badge>
                  <Badge variant={riskBadgeVariant(selectedProduct.stockRisk)}>{selectedProduct.stockHint}</Badge>
                </div>
                <p className="mt-4 text-sm text-zinc-300">Tema {selectedProduct.theme}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-xs text-zinc-500">Pix</p>
                    <p className="font-semibold text-zinc-50">{formatCurrencyBRL(selectedProduct.pricePix)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-xs text-zinc-500">Cartão</p>
                    <p className="font-semibold text-zinc-50">{formatCurrencyBRL(selectedProduct.priceCard)}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Margem</p>
                  <p className={`mt-2 font-heading text-2xl ${selectedProduct.marginPercent >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {selectedProduct.marginPercent}%
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Prazo médio</p>
                  <p className="mt-2 font-heading text-2xl text-zinc-50">
                    {selectedProduct.avgLeadDays} dia(s)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.tags.map((tag) => (
                    <Badge key={tag} variant="muted">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  className="flex-1 rounded-2xl"
                  onClick={() => {
                    cart.addProduct(selectedProduct);
                    toast.success("Produto adicionado ao carrinho.");
                    setSelectedProduct(null);
                    setCartOpen(true);
                  }}
                >
                  <ShoppingCart className="size-4" />
                  Adicionar no carrinho
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 rounded-2xl"
                  onClick={() => {
                    const query = mergeSearchParams(new URLSearchParams(), {
                      produto: selectedProduct.name,
                      qtd: "1",
                      valor: selectedProduct.pricePix.toString(),
                    });
                    router.push(`/loja/pedidos?${query}` as Route);
                  }}
                >
                  <Check className="size-4" />
                  Criar pedido
                </Button>
              </div>
            </div>
          </SheetContent>
        ) : null}
      </Sheet>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Carrinho do catálogo</SheetTitle>
            <SheetDescription>
              Persistente neste dispositivo para montar pedidos e fechar atendimento rápido. O painel
              recolhe automaticamente quando fica inativo.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            {cart.items.length ? (
              <>
                <div className="space-y-2">
                  <Label>Cliente (opcional)</Label>
                  <Input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Nome para incluir no resumo"
                  />
                </div>

                <ScrollArea className="h-[38vh] rounded-2xl border border-white/8 bg-white/6 p-3">
                  <div className="space-y-3 pr-3">
                    {cart.items.map((item) => (
                      <div key={item.productId} className="rounded-2xl border border-white/8 bg-black/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-zinc-100">{item.name}</p>
                            <p className="text-xs text-zinc-400">
                              Pix {formatCurrencyBRL(item.unitPricePix)} | Cartão {formatCurrencyBRL(item.unitPriceCard)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="rounded-xl"
                            onClick={() => cart.removeProduct(item.productId)}
                          >
                            Remover
                          </Button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="rounded-xl"
                            onClick={() => cart.setQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <p className="min-w-10 text-center text-sm text-zinc-200">{item.quantity}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="rounded-xl"
                            onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/6 p-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Subtotal Pix</p>
                    <p className="mt-1 font-semibold text-zinc-50">{formatCurrencyBRL(cart.totals.pix)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Subtotal Cartão</p>
                    <p className="mt-1 font-semibold text-zinc-50">{formatCurrencyBRL(cart.totals.card)}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button className="rounded-2xl" onClick={openWhatsAppCart}>
                    <ShoppingCart className="size-4" />
                    Enviar para WhatsApp
                  </Button>
                  <Button variant="secondary" className="rounded-2xl" onClick={copyCartSummary}>
                    Copiar resumo
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-2xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                    onClick={() => {
                      cart.clear();
                      toast.success("Carrinho limpo.");
                    }}
                  >
                    Limpar carrinho
                  </Button>
                </div>
              </>
            ) : (
              <EmptyState
                icon={ShoppingCart}
                title={cart.hydrated ? "Carrinho vazio" : "Carregando carrinho"}
                description={
                  cart.hydrated
                    ? "Adicione produtos do catálogo para montar orçamento ou atendimento."
                    : "Sincronizando dados locais do carrinho."
                }
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {cart.items.length ? (
        <button
          type="button"
          className="fixed bottom-28 right-5 z-30 flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-100 shadow-[0_24px_80px_-30px_rgba(16,185,129,1)] backdrop-blur-xl sm:right-8"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingCart className="size-4" />
          {cart.totals.quantity} item(ns) • {formatCurrencyBRL(cart.totals.pix)}
          <Star className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
