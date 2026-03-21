import type { MetadataRoute } from "next";

import { appName } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: appName,
    short_name: appName,
    description:
      "Hub mobile-first para finanças e operação do automóvel, com uso rápido no celular e no desktop.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#030712",
    lang: "pt-BR",
    categories: ["finance", "business", "productivity"],
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Financeiro",
        short_name: "Financeiro",
        description: "Abrir o painel financeiro",
        url: "/financeiro",
        icons: [{ src: "/icon?size=192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Automóvel",
        short_name: "Auto",
        description: "Abrir o módulo de veículos",
        url: "/moto",
        icons: [{ src: "/icon?size=192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Abastecimentos",
        short_name: "Combustível",
        description: "Registrar combustível com cálculo automático",
        url: "/moto/abastecimentos",
        icons: [{ src: "/icon?size=192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Relatórios",
        short_name: "Relatórios",
        description: "Abrir comparativos e gráficos",
        url: "/relatorios",
        icons: [{ src: "/icon?size=192", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
