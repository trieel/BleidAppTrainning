import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BleidAppTraining",
    short_name: "BleidApp",
    description: "Rutinas y seguimiento de entrenamiento.",
    start_url: "/",
    display: "standalone",
    background_color: "#080a0b",
    theme_color: "#c8ff32",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
