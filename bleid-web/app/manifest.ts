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
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
