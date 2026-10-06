import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Controle Blue",
    short_name: "Blue",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#2563eb",
    lang: "pt-BR",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
