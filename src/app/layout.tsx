import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
  Geist_Mono,
} from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { SwRegister } from "@/components/pwa/sw-register";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontDisplay = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Elbimas — Aplikasi Pengelola Keuangan Pribadi",
    template: "%s | Elbimas",
  },
  description:
    "Website pengelola keuangan pribadi gratis: catat pemasukan & pengeluaran, multi-dompet, budget bulanan, target tabungan, utang-piutang, dan laporan keuangan.",
  applicationName: "Elbimas",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Elbimas",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f8a6d" },
    { media: "(prefers-color-scheme: dark)", color: "#0c2420" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster richColors position="top-center" />
          <SwRegister />
        </Providers>
      </body>
    </html>
  );
}
