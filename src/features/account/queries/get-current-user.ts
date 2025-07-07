"use server"

import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { prisma } from "@/lib/prisma"
import { cache } from "react"

export const getCurrentUser = cache(async () => {
  const { user } = await getAuthOrRedirect()

  const foundUser = await prisma.users.findUnique({
    where: {
      id: user.id
    },
    include: {
      company: true,
      roles: true,
      speakers: true,
      attendance_list: {
        include: {
          events: {
            select: {
              id: true,
              title: true,
              date: true,
              format: true
            }
          }
        },
        orderBy: {
          created_at: "desc"
        }
      }
    }
  })

  return foundUser;
});