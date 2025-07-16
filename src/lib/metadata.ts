// /lib/metadata.ts
import { Metadata } from "next"

interface EventMetadataProps {
  title: string
  description?: string
  image?: string
  url: string
  keywords?: string[]
  publishedTime?: string
  modifiedTime?: string
  isPublished?: boolean
}

export function generateEventMetadata({
  title,
  description,
  image,
  url,
  keywords = [],
  publishedTime,
  modifiedTime,
  isPublished = true
}: EventMetadataProps): Metadata {
  const baseKeywords = [
    "ABF",
    "eventos",
    "franchising",
    "associados",
    "networking",
    "palestras",
    "workshops"
  ]

  const allKeywords = [...baseKeywords, ...keywords]

  return {
    title: `${title} - ABF Eventos`,
    description: description || `Participe do evento ${title} da ABF. Inscreva-se já!`,
    keywords: allKeywords,
    authors: [{ name: "ABF Eventos" }],
    creator: "Associação Brasileira de Franchising",
    publisher: "ABF",
    
    openGraph: {
      title,
      description: description || `Participe do evento ${title} da ABF. Inscreva-se já!`,
      url,
      siteName: "Portal de Eventos ABF",
      images: [
        {
          url: image || "/og-event-default.jpg",
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      locale: "pt_BR",
      type: "article",
      publishedTime,
      modifiedTime,
    },
    
    twitter: {
      card: "summary_large_image",
      title,
      description: description || `Participe do evento ${title} da ABF. Inscreva-se já!`,
      images: [image || "/twitter-event-default.jpg"],
      creator: "@ABF_franquias",
      site: "@ABF_franquias",
    },
    
    alternates: {
      canonical: url,
    },
    
    robots: {
      index: isPublished,
      follow: isPublished,
      googleBot: {
        index: isPublished,
        follow: isPublished,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      }
    },
    
    ...(publishedTime && modifiedTime && {
      other: {
        "event:start_time": publishedTime,
        "event:end_time": modifiedTime,
      }
    })
  }
}

export function generateListingMetadata(
  type: "eventos" | "admin",
  customDescription?: string
): Metadata {
  const isAdmin = type === "admin"
  
  const title = isAdmin ? "Administração de Eventos" : "Eventos"
  const description = customDescription || 
    (isAdmin 
      ? "Painel administrativo para gerenciar eventos da ABF"
      : "Descubra e participe dos eventos de franchising da ABF. Encontre palestras, workshops e networking."
    )

  return {
    title: `${title} - ABF Eventos`,
    description,
    keywords: isAdmin 
      ? ["admin", "gestão", "eventos", "ABF", "painel"]
      : ["eventos", "ABF", "franchising", "palestras", "workshops", "networking"],
    
    openGraph: {
      title: `${title} - ABF`,
      description,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${type}`,
      siteName: "Portal de Eventos ABF",
      images: [
        {
          url: isAdmin ? "/og-admin.jpg" : "/og-eventos.jpg",
          width: 1200,
          height: 630,
          alt: `${title} ABF`,
        }
      ],
      locale: "pt_BR",
      type: "website",
    },
    
    twitter: {
      card: "summary_large_image",
      title: `${title} - ABF`,
      description,
      images: [isAdmin ? "/twitter-admin.jpg" : "/twitter-eventos.jpg"],
      creator: "@ABF_franquias",
      site: "@ABF_franquias",
    },
    
    robots: {
      index: !isAdmin, // Não indexar páginas admin
      follow: !isAdmin,
      googleBot: {
        index: !isAdmin,
        follow: !isAdmin,
      }
    }
  }
}