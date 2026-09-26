import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { THEME_SCRIPT } from "@/lib/theme-script";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "MedTech Academy",
  description: "KT uskunasi operatorlari va tibbiy muhandislar uchun AI trenajor",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${spaceGrotesk.variable} ${plex.variable} ${jetbrains.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="relative flex min-h-full flex-col">
        <div className="gantry-bg pointer-events-none fixed inset-0 -z-10" />
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
