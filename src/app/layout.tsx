import { Montserrat } from "next/font/google";
import "./globals.css";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Header } from "./_navigation/header";
import { ThemeProvider } from "@/components/theme/theme-provider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning >
      <body
        className={`${montserrat.variable} antialiased`}
      >
        <ThemeProvider>
          <NuqsAdapter>
            <Header />
            <main className="flex w-full h-screen bg-background pt-20 ">
              {children}
            </main>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html >
  );




}