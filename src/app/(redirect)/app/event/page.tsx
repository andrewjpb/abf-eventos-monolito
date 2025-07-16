// /app/app/event/page.tsx - Redirect para listagem de eventos
import { redirect } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Redirecionando... - ABF Eventos",
  description: "Você está sendo redirecionado para a página de eventos.",
  robots: {
    index: false,
    follow: false,
  }
}

export default function EventsRedirectPage() {
  // Redirect para a listagem de eventos
  redirect("/eventos")
}