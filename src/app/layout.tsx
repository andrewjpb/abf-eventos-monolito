import { Montserrat } from "next/font/google";
import "./globals.css";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Header } from "./_navigation/header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Metadata } from "next";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

// Definindo metadados para SEO e compartilhamento social
export const metadata: Metadata = {
  title: {
    default: "Eventos ABF | Associação Brasileira de Franchising",
    template: "%s | Eventos ABF"
  },
  description: "Portal de eventos exclusivos para associados da ABF (Associação Brasileira de Franchising). Confira nossa agenda de conferências, workshops e networking.",
  generator: "Next.js",
  applicationName: "Eventos ABF",
  referrer: "origin-when-cross-origin",
  keywords: ["ABF", "eventos", "franchising", "associados", "franqueados", "franquia", "networking", "conferências", "Brasil"],
  authors: [{ name: "ABF", url: "https://abf.com.br" }],
  creator: "Associação Brasileira de Franchising",
  publisher: "ABF",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://eventos.abf.com.br"),
  alternates: {
    canonical: "/",
    languages: {
      "pt-BR": "/",
    },
  },
  openGraph: {
    title: "Eventos ABF | Associação Brasileira de Franchising",
    description: "Portal de eventos exclusivos para associados da ABF. Encontre as melhores oportunidades de networking e capacitação para o mercado de franchising.",
    url: "https://eventos.abf.com.br",
    siteName: "Portal de Eventos ABF",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Logo da ABF com texto 'Portal de Eventos'",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventos ABF | Associação Brasileira de Franchising",
    description: "Confira os próximos eventos exclusivos para associados da ABF e impulsione seu negócio de franchising.",
    creator: "@ABF_franquias",
    images: ["/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/shortcut-icon.png"],
    apple: [
      { url: "/apple-icon.png" },
      { url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/apple-touch-icon-precomposed.png",
      },
    ],
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  category: "eventos",
  verification: {
    google: "google-site-verification=CODIGO_DE_VERIFICACAO_AQUI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} antialiased`}
      >
        <ThemeProvider>
          <NuqsAdapter>
            <Header />
            <main className="flex w-full h-screen bg-background pt-20">
              {children}
            </main>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}