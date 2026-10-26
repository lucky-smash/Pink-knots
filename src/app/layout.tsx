import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Instrument_Serif } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { QuoteProvider } from "@/components/quote/QuoteProvider";
import { collections, productsInCollection } from "@/lib/catalogue";
import { site } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website", locale: "en_IN" },
};

export const viewport: Viewport = { themeColor: "#f6f1e9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const navCollections = collections.map((c) => ({
    slug: c.slug,
    name: c.name,
    blurb: c.blurb,
    count: productsInCollection(c.slug).length,
  }));

  return (
    <html lang="en-IN" className={`${bricolage.variable} ${geist.variable} ${instrument.variable}`}>
      <body>
        <QuoteProvider>
          <SiteHeader collections={navCollections} />
          <main id="main">{children}</main>
          <SiteFooter />
        </QuoteProvider>
      </body>
    </html>
  );
}
