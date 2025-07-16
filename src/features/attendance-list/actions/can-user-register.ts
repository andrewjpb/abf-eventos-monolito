// /features/attendance-list/queries/can-user-register.ts
"use server"

import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

export const canUserRegister = cache(async (eventId: string) => {
  const { user } = await getAuth()

  if (!user) {
    return {
      canRegister: false,
      message: "É necessário estar autenticado para se inscrever"
    }
  }

  // Verificar se o evento existe
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      date: true,
      vacancy_total: true,
      vacancies_per_brand: true,
      isPublished: true,
      exclusive_for_members: true,
      // Contar inscrições totais
      _count: {
        select: {
          attendance_list: true
        }
      }
    }
  })

  if (!event) {
    return {
      canRegister: false,
      message: "Evento não encontrado"
    }
  }

  // Verificar se o evento está publicado
  if (!event.isPublished) {
    return {
      canRegister: false,
      message: "Evento não disponível para inscrições"
    }
  }

  // Verificar se o evento é exclusivo para associados
  if (event.exclusive_for_members) {
    if (!user) {
      return {
        canRegister: false,
        message: "Este evento é exclusivo para associados da ABF. Faça login para se inscrever."
      }
    }

    // Verificar se a empresa do usuário está ativa (é associada)
    const userCompany = await prisma.company.findUnique({
      where: { cnpj: user.companyId },
      select: { active: true, name: true }
    })

    if (!userCompany || !userCompany.active) {
      return {
        canRegister: false,
        message: "Este evento é exclusivo para empresas associadas à ABF. Sua empresa não possui associação ativa."
      }
    }
  }

  // Verificar se o evento já ocorreu
  const now = new Date()
  const eventDate = new Date(event.date)

  if (now > eventDate) {
    return {
      canRegister: false,
      message: "Evento já realizado"
    }
  }

  // Verificar se há vagas disponíveis
  if (event._count.attendance_list >= event.vacancy_total) {
    return {
      canRegister: false,
      message: "Não há mais vagas disponíveis para este evento"
    }
  }

  // Verificar se o usuário já está inscrito
  const existingAttendance = await prisma.attendance_list.findFirst({
    where: {
      eventId,
      userId: user.id
    }
  })

  if (existingAttendance) {
    return {
      canRegister: false,
      isRegistered: true,
      message: "Você já está inscrito neste evento",
      attendanceId: existingAttendance.id
    }
  }

  // Verificar a quantidade de inscrições da empresa do usuário
  const companyAttendanceCount = await prisma.attendance_list.count({
    where: {
      eventId,
      company_cnpj: user.companyId
    }
  })

  if (companyAttendanceCount >= event.vacancies_per_brand) {
    return {
      canRegister: false,
      message: `Sua empresa já atingiu o limite de ${event.vacancies_per_brand} inscrições para este evento`
    }
  }

  // Obter informações da empresa para pré-preencher o formulário
  const company = await prisma.company.findUnique({
    where: { cnpj: user.companyId },
    select: { name: true, segment: true }
  })

  return {
    canRegister: true,
    message: "Você pode se inscrever neste evento",
    event: {
      id: event.id,
      title: event.title,
      date: event.date,
      totalVacancies: event.vacancy_total,
      remainingVacancies: event.vacancy_total - event._count.attendance_list,
      vacanciesPerBrand: event.vacancies_per_brand,
      companyRemainingVacancies: event.vacancies_per_brand - companyAttendanceCount
    },
    userInfo: {
      id: user.id,
      name: user.username,
      email: user.email,
      position: user.position,
      rg: user.rg,
      cpf: user.cpf,
      mobile_phone: user.mobilePhone
    },
    companyInfo: {
      cnpj: user.companyId,
      name: company?.name || "",
      segment: company?.segment || ""
    }
  }
})