"use server"

import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

export type AdminEventsStats = {
  total: number
  published: number
  draft: number
  archived: number
}

export async function getAdminEventsStats(): Promise<AdminEventsStats> {
  await getAuthWithPermissionOrRedirect("events.read")
  
  // Executar todas as contagens em paralelo
  const [total, published, draft, archived] = await Promise.all([
    prisma.events.count(), // total
    prisma.events.count({ 
      where: { 
        isPublished: true, 
        date: { gte: new Date() } 
      } 
    }), // published
    prisma.events.count({ 
      where: { 
        isPublished: false 
      } 
    }), // draft
    prisma.events.count({ 
      where: { 
        isPublished: true, 
        date: { lt: new Date() } 
      } 
    }) // archived
  ])

  return {
    total,
    published,
    draft,
    archived
  }
}