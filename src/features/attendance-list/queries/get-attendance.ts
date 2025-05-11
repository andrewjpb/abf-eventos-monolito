// /features/attendance-list/queries/get-attendance.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

export const getAttendance = cache(async (attendanceId: string) => {
  const { user } = await getAuth()

  if (!user) {
    return null
  }

  // Verificar se a inscrição existe
  const attendance = await prisma.attendance_list.findUnique({
    where: {
      id: attendanceId
    },
    include: {
      events: {
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
          }
        }
      },
      company: true,
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          position: true,
          image_url: true
        }
      }
    }
  })

  if (!attendance) {
    return null
  }

  // Verificar se o usuário tem permissão para ver os detalhes desta inscrição
  // (Apenas o próprio usuário inscrito ou administradores)
  const isOwner = attendance.userId === user.id
  const isAdmin = user.roles.some(role => role.name === "ADMIN")

  // Verificar a permissão do usuário consultando seu role (se não for dono nem admin)
  const userWithRoles = !isAdmin && !isOwner ? await prisma.users.findUnique({
    where: { id: user.id },
    include: {
      roles: true
    }
  }) : null

  const hasAdminRole = userWithRoles?.roles.some(role => role.name === "ADMIN") || false

  if (!isOwner && !isAdmin && !hasAdminRole) {
    return {
      attendance: null,
      isAuthorized: false,
      message: "Você não tem permissão para visualizar esta inscrição"
    }
  }

  // Retornar informações da inscrição
  return {
    attendance,
    isAuthorized: true,
    event: {
      id: attendance.events.id,
      title: attendance.events.title,
      date: attendance.events.date,
      location: attendance.events.address ? `${attendance.events.address.cities.name}, ${attendance.events.address.states.uf}` : '',
      speakersCount: attendance.events.speakers?.length || 0
    }
  }
})