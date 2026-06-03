import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gagan Transmissions ERP",
    short_name: "GT ERP",
    description: "Inventory management system for Gagan Transmissions",
    start_url: "/",
    display: "standalone",
    background_color: "#eff6ff",
    theme_color: "#2563eb",
    orientation: "any",
    categories: ["productivity", "business"],
    icons: [
      { src: "/icon.png",       sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png",       sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-mask.png",  sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
