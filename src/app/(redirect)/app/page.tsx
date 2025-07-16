// /app/app/page.tsx - Redirect da pasta app raiz
import { redirect } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Redirecionando... - ABF Eventos",
  description: "Você está sendo redirecionado para a página inicial.",
  robots: {
    index: false,
    follow: false,
  }
}

export default function AppRedirectPage() {
  // Redirect para a página inicial
  redirect("/")
}