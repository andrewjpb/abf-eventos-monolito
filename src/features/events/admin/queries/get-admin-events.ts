"use server"

import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { adminEventSearchParamsSchema, type AdminEventSearchParams } from "../search-params"
import { type AdminEventSummary, getEventStatus } from "../types"
import { Prisma } from "@prisma/client"

type GetAdminEventsResult = {
  events: AdminEventSummary[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  stats: {
    total: number
    published: number
    draft: number
    archived: number
  }
}

export async function getAdminEvents(
  searchParams: AdminEventSearchParams
): Promise<GetAdminEventsResult> {
  await getAuthWithPermissionOrRedirect("events.read")
  
  const validatedParams = adminEventSearchParamsSchema.parse(searchParams)
  const { page, per_page, search, status, format, highlight, date_from, date_to, city, state, sort } = validatedParams

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

  // Calcular offset para paginação
  const offset = (page - 1) * per_page

  // Executar queries em paralelo
  const [events, total, totalStats] = await Promise.all([
    // Query principal com paginação
    prisma.events.findMany({
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
        exclusive_for_members: true,
        created_at: true,
        updatedAt: true,
        // Campos de evento internacional
        is_international: true,
        location_city: true,
        location_state: true,
        location_country: true,
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
      orderBy,
      skip: offset,
      take: per_page
    }),

    // Contagem total para paginação
    prisma.events.count({ where }),

    // Estatísticas gerais
    Promise.all([
      prisma.events.count(), // total
      prisma.events.count({ where: { isPublished: true, date: { gte: new Date() } } }), // published
      prisma.events.count({ where: { isPublished: false } }), // draft
      prisma.events.count({ where: { isPublished: true, date: { lt: new Date() } } }) // archived
    ])
  ])

  // Calcular informações de paginação
  const total_pages = Math.ceil(total / per_page)
  const has_next = page < total_pages
  const has_prev = page > 1

  const [totalCount, publishedCount, draftCount, archivedCount] = totalStats

  return {
    events: events as AdminEventSummary[],
    pagination: {
      page,
      per_page,
      total,
      total_pages,
      has_next,
      has_prev
    },
    stats: {
      total: totalCount,
      published: publishedCount,
      draft: draftCount,
      archived: archivedCount
    }
  }
}