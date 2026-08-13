import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BRAND } from "@/lib/brand";

const headingSans = Instrument_Sans({ variable: "--font-heading-sans", subsets: ["latin"] });
const headingMono = JetBrains_Mono({ variable: "--font-heading-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${BRAND.name} | ${BRAND.tagline}`,
  description: BRAND.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${headingSans.variable} ${headingMono.variable} h-full antialiased`}
    >
      <body className="bg-grid min-h-full">
        <Providers>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
