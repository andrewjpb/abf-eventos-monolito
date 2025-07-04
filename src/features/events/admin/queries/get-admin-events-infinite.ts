"use server"

import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { type AdminEventSummary } from "../types"
import { Prisma } from "@prisma/client"

export type GetAdminEventsInfiniteParams = {
  cursor?: string
  limit?: number
  search?: string
  status?: 'published' | 'draft' | 'archived'
  format?: string
  highlight?: string
  date_from?: string
  date_to?: string
  city?: string
  state?: string
  sort?: string
}

type GetAdminEventsInfiniteResult = {
  events: AdminEventSummary[]
  metadata?: {
    hasNextPage: boolean
    cursor?: string
  }
}

export async function getAdminEventsInfinite(
  params: GetAdminEventsInfiniteParams
): Promise<GetAdminEventsInfiniteResult> {
  await getAuthWithPermissionOrRedirect("events.read")
  
  const { 
    cursor, 
    limit = 12, 
    search, 
    status, 
    format, 
    highlight, 
    date_from, 
    date_to, 
    city, 
    state, 
    sort = 'date_desc' 
  } = params

  // Construir filtros WHERE
  const where: Prisma.eventsWhereInput = {}

  // Filtro de busca por texto
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Filtro por status
  if (status) {
    switch (status) {
      case 'published':
        where.isPublished = true
        where.date = { gte: new Date() }
        break
      case 'draft':
        where.isPublished = false
        break
      case 'archived':
        where.isPublished = true
        where.date = { lt: new Date() }
        break
    }
  }

  // Filtro por formato
  if (format) {
    where.format = format
  }

  // Filtro por destaque
  if (highlight === 'true') {
    where.highlight = true
  } else if (highlight === 'false') {
    where.highlight = false
  }

  // Filtro por período de data
  if (date_from || date_to) {
    where.date = {}
    if (date_from) {
      where.date.gte = new Date(date_from)
    }
    if (date_to) {
      where.date.lte = new Date(date_to)
    }
  }

  // Filtro por cidade/estado
  if (city || state) {
    where.address = {}
    if (city) {
      where.address.cities = {
        name: { contains: city, mode: 'insensitive' }
      }
    }
    if (state) {
      where.address.states = {
        OR: [
          { uf: { contains: state, mode: 'insensitive' } },
          { name: { contains: state, mode: 'insensitive' } }
        ]
      }
    }
  }

  // Cursor para paginação infinita
  if (cursor) {
    where.id = {
      lt: cursor
    }
  }

  // Configurar ordenação
  let orderBy: Prisma.eventsOrderByWithRelationInput = {}
  switch (sort) {
    case 'date_asc':
      orderBy = { date: 'asc' }
      break
    case 'date_desc':
      orderBy = { date: 'desc' }
      break
    case 'created_asc':
      orderBy = { created_at: 'asc' }
      break
    case 'created_desc':
      orderBy = { created_at: 'desc' }
      break
    case 'title_asc':
      orderBy = { title: 'asc' }
      break
    case 'title_desc':
      orderBy = { title: 'desc' }
      break
    case 'enrollments_asc':
      orderBy = { attendance_list: { _count: 'asc' } }
      break
    case 'enrollments_desc':
      orderBy = { attendance_list: { _count: 'desc' } }
      break
    default:
      orderBy = { date: 'desc' }
  }

  // Buscar eventos com limite + 1 para verificar se há próxima página
  const events = await prisma.events.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      image_url: true,
      thumb_url: true,
      summary: true,
      date: true,
      format: true,
      vacancy_total: true,
      highlight: true,
      isPublished: true,
      created_at: true,
      updatedAt: true,
      address: {
        select: {
          cities: {
            select: { name: true }
          },
          states: {
            select: { uf: true }
          }
        }
      },
      _count: {
        select: {
          attendance_list: true
        }
      }
    },
    orderBy: [orderBy, { id: 'desc' }], // ID como critério secundário para cursor consistente
    take: limit + 1
  })

  // Verificar se há próxima página
  const hasNextPage = events.length > limit
  const eventsToReturn = hasNextPage ? events.slice(0, limit) : events
  const nextCursor = hasNextPage ? eventsToReturn[eventsToReturn.length - 1]?.id : undefined

  return {
    events: eventsToReturn as AdminEventSummary[],
    metadata: {
      hasNextPage,
      cursor: nextCursor
    }
  }
}