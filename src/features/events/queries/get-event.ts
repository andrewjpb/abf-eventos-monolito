// /features/events/queries/get-event.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"
import { canUserRegister } from "@/features/attendance-list/actions/can-user-register"
import { checkUserPermission } from "@/features/permissions/queries/check-user-permission"
import { notFound } from "next/navigation"

export const getEvent = cache(async (id: string) => {
  // Verificar se o evento existe
  const event = await prisma.events.findUnique({
    where: {
      id
    },
    include: {
      address: {
        include: {
          cities: true,
          states: true
        }
      },
      speakers: {
        include: {
          users: true
        }
      },
      schedule: {
        orderBy: [
          { day_date: 'asc' },
          { order_index: 'asc' },
          { start_time: 'asc' }
        ]
      },
      _count: {
        select: {
          attendance_list: true
        }
      }
    }
  })

  if (!event) {
    notFound()
  }

  // Buscar patrocinadores ordenados
  const sponsorsOrdered = await prisma.sponsors.findMany({
    where: {
      events: {
        some: {
          id: event.id
        }
      }
    },
    include: {
      _count: {
        select: {
          events: true
        }
      }
    }
  })

  // Buscar ordens dos patrocinadores
  const sponsorOrders = await prisma.event_sponsor_order.findMany({
    where: {
      eventId: event.id,
      sponsorId: {
        in: sponsorsOrdered.map(s => s.id)
      }
    }
  })

  // Mapear ordens dos patrocinadores
  const sponsorOrderMap = sponsorOrders.reduce((acc, order) => {
    acc[order.sponsorId] = order.order
    return acc
  }, {} as Record<string, number>)

  // Ordenar patrocinadores
  const orderedSponsors = sponsorsOrdered
    .map(sponsor => ({
      ...sponsor,
      order: sponsorOrderMap[sponsor.id] || 0
    }))
    .sort((a, b) => a.order - b.order)

  // Buscar apoiadores ordenados
  const supportersOrdered = await prisma.supporters.findMany({
    where: {
      events: {
        some: {
          id: event.id
        }
      }
    },
    include: {
      _count: {
        select: {
          events: true
        }
      }
    }
  })

  // Buscar ordens dos apoiadores
  const supporterOrders = await prisma.event_supporter_order.findMany({
    where: {
      eventId: event.id,
      supporterId: {
        in: supportersOrdered.map(s => s.id)
      }
    }
  })

  // Mapear ordens dos apoiadores
  const supporterOrderMap = supporterOrders.reduce((acc, order) => {
    acc[order.supporterId] = order.order
    return acc
  }, {} as Record<string, number>)

  // Ordenar apoiadores
  const orderedSupporters = supportersOrdered
    .map(supporter => ({
      ...supporter,
      order: supporterOrderMap[supporter.id] || 0
    }))
    .sort((a, b) => a.order - b.order)

  // Adicionar os dados ordenados ao evento
  const eventWithOrderedRelations = {
    ...event,
    sponsors: orderedSponsors,
    supporters: orderedSupporters
  }

  // Verificar permissões do usuário
  const { user } = await getAuth()

  // Se o evento não está publicado, apenas usuários com permissão podem vê-lo
  if (!event.isPublished) {
    // Verificar se o usuário tem permissão para visualizar eventos não publicados
    if (!user) {
      notFound() // Redirecionar para 404 para não revelar a existência do evento
    }

    const userWithRoles = await prisma.users.findUnique({
      where: { id: user.id },
      include: {
        roles: true
      }
    })

    const isAdmin = userWithRoles?.roles.some(role => role.name === "ADMIN") || false
    
    // Verificar se tem permissão para criar eventos
    const hasEventCreatePermission = await checkUserPermission(user.id, "events.create")

    if (!isAdmin && !hasEventCreatePermission) {
      notFound() // Redirecionar para 404
    }
  }

  // Verificar se o usuário está inscrito
  let isRegistered = false
  let attendanceId = null

  if (user) {
    const attendance = await prisma.attendance_list.findFirst({
      where: {
        eventId: id,
        userId: user.id
      },
      select: {
        id: true
      }
    })

    if (attendance) {
      isRegistered = true
      attendanceId = attendance.id
    }
  }

  // Verifique se o usuário é um administrador (para operações de edição)
  let isAdmin = false

  if (user) {
    const userWithRoles = await prisma.users.findUnique({
      where: { id: user.id },
      include: {
        roles: true,
        company: true
      }
    })

    isAdmin = userWithRoles?.roles.some(role => role.name === "ADMIN") || false
    
    // Garantir que o usuário tenha os dados da empresa
    if (userWithRoles?.company) {
      user.company = userWithRoles.company
    }
  }

  // Calcular vagas restantes por empresa (se o usuário estiver logado)
  let companyRemainingVacancies = 0
  let companyAttendees = 0
  if (user && user.companyId) {
    // Contar quantos inscritos da mesma empresa já estão cadastrados
    companyAttendees = await prisma.attendance_list.count({
      where: {
        eventId: id,
        company_cnpj: user.companyId
      }
    })
    
    companyRemainingVacancies = Math.max(0, event.vacancies_per_brand - companyAttendees)
  }

  // Verificar se o usuário pode se inscrever (apenas se estiver logado e não estiver registrado)
  let canRegister = null
  if (user && !isRegistered) {
    try {
      const result = await canUserRegister(id)
      canRegister = {
        canRegister: result.canRegister,
        reason: result.message
      }
    } catch (error) {
      canRegister = { canRegister: false, reason: "Erro ao verificar elegibilidade" }
    }
  }

  // Verificar se tem permissão para criar eventos (para usar na tarja)
  let hasEventCreatePermission = false
  if (user) {
    hasEventCreatePermission = await checkUserPermission(user.id, "events.create")
  }

  return {
    event: eventWithOrderedRelations,
    isRegistered,
    attendanceId,
    isAdmin,
    user,
    canRegister,
    remainingVacancies: Math.max(0, event.vacancy_total - event._count.attendance_list),
    companyRemainingVacancies,
    companyAttendees,
    occupationPercentage: Math.min(100, Math.round((event._count.attendance_list / event.vacancy_total) * 100)),
    hasEventCreatePermission
  }
})