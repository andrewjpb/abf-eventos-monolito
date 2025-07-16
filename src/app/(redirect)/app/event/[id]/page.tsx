// /app/app/event/[id]/page.tsx - Redirect para compatibilidade com links antigos
import { redirect } from "next/navigation"
import { Metadata } from "next"

type RedirectPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: RedirectPageProps): Promise<Metadata> {
  const { id } = await params
  
  return {
    title: "Redirecionando... - ABF Eventos",
    description: "Você está sendo redirecionado para a nova página do evento.",
    robots: {
      index: false,
      follow: false,
    }
  }
}

export default async function EventRedirectPage({ params }: RedirectPageProps) {
  const { id } = await params
  
  // Redirect para a nova estrutura de URLs
  redirect(`/eventos/${id}`)
}