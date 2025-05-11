// /features/events/queries/get-event.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"
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
      sponsors: true,
      supporters: true,
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

  // Verificar permissões do usuário
  const { user } = await getAuth()

  // Se o evento não está publicado, apenas administradores podem vê-lo
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

    if (!isAdmin) {
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
        roles: true
      }
    })

    isAdmin = userWithRoles?.roles.some(role => role.name === "ADMIN") || false
  }

  return {
    event,
    isRegistered,
    attendanceId,
    isAdmin,
    remainingVacancies: Math.max(0, event.vacancy_total - event._count.attendance_list),
    occupationPercentage: Math.min(100, Math.round((event._count.attendance_list / event.vacancy_total) * 100))
  }
})