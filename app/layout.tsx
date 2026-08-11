import "./globals.css";

import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { cn } from "@/lib/core/utils";

import { Providers } from "./providers";

const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Plantilla Next.js",
  description: "Plantilla base Next.js 16 + Prisma + Tailwind 4 + TanStack Query",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("font-mono", inter.variable, interHeading.variable, geistMono.variable)}
    >
      <body className="bg-background text-foreground antialiased">
        <NuqsAdapter>
          <Providers>{children}</Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
