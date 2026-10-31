import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bleid.app"),
  title: {
    default: "Bleid — Entrenamiento de Alto Rendimiento",
    template: "%s | Bleid Training",
  },
  description: "Rutinas adaptativas, telemetría de volumen y seguimiento de sobrecarga progresiva sin distracciones.",
  applicationName: "Bleid Training",
  manifest: "/manifest.webmanifest",
  keywords: [
    "entrenamiento",
    "fitness",
    "rutinas",
    "gimnasio",
    "hipertrofia",
    "fuerza",
    "sobrecarga progresiva",
    "workout tracker",
  ],
  authors: [{ name: "Bleid Training" }],
  creator: "Bleid Training",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://bleid.app",
    title: "Bleid — Entrenamiento de Alto Rendimiento",
    description: "Rutinas adaptativas, telemetría de volumen y seguimiento de sobrecarga progresiva.",
    siteName: "Bleid",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Bleid Training Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Bleid — Entrenamiento de Alto Rendimiento",
    description: "Rutinas adaptativas, telemetría de volumen y seguimiento de sobrecarga progresiva.",
    images: ["/icon-512x512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bleid",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-precomposed.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
