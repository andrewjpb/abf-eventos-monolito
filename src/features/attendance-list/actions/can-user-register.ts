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
      vacancy_online: true,
      vacancies_per_brand: true,
      isPublished: true,
      exclusive_for_members: true,
      free_online: true,
      attendance_list: {
        select: {
          attendee_type: true,
          company_cnpj: true
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

  // Contar inscrições presenciais e online
  const presentialCount = event.attendance_list.filter(a => a.attendee_type === 'in_person').length
  const onlineCount = event.attendance_list.filter(a => a.attendee_type === 'online').length

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

  // Contar inscrições da empresa do usuário (separadas por tipo)
  const companyPresentialCount = event.attendance_list.filter(
    a => a.company_cnpj === user.companyId && a.attendee_type === 'in_person'
  ).length
  const companyOnlineCount = event.attendance_list.filter(
    a => a.company_cnpj === user.companyId && a.attendee_type === 'online'
  ).length

  // Calcular vagas disponíveis
  const presentialVacanciesAvailable = event.vacancy_total - presentialCount
  const onlineVacanciesAvailable = event.vacancy_online - onlineCount

  // Regras de validação de vagas por marca:
  // - Presencial: SEMPRE valida contra vacancies_per_brand
  // - Online com free_online=true: NÃO valida contra vacancies_per_brand
  // - Online com free_online=false: valida APENAS vagas online contra vacancies_per_brand
  const canRegisterPresential = presentialVacanciesAvailable > 0 &&
    companyPresentialCount < event.vacancies_per_brand

  let canRegisterOnline = false
  if (event.free_online) {
    // Quando free_online = true, apenas verifica se há vagas online disponíveis
    canRegisterOnline = onlineVacanciesAvailable > 0
  } else {
    // Quando free_online = false, verifica vagas online E limite da marca (apenas online)
    canRegisterOnline = onlineVacanciesAvailable > 0 &&
      companyOnlineCount < event.vacancies_per_brand
  }

  // Se não pode se inscrever em nenhum tipo
  if (!canRegisterPresential && !canRegisterOnline) {
    if (presentialVacanciesAvailable <= 0 && onlineVacanciesAvailable <= 0) {
      return {
        canRegister: false,
        message: "Não há mais vagas disponíveis para este evento"
      }
    }

    if (companyPresentialCount >= event.vacancies_per_brand) {
      return {
        canRegister: false,
        message: `Sua empresa já atingiu o limite de ${event.vacancies_per_brand} inscrições para este evento`
      }
    }

    return {
      canRegister: false,
      message: "Não há vagas disponíveis no momento"
    }
  }

  // Obter informações da empresa para pré-preencher o formulário
  const company = await prisma.company.findUnique({
    where: { cnpj: user.companyId },
    select: { name: true, segment: true }
  })

  return {
    canRegister: true,
    canRegisterPresential,
    canRegisterOnline,
    message: "Você pode se inscrever neste evento",
    event: {
      id: event.id,
      title: event.title,
      date: event.date,
      totalVacancies: event.vacancy_total,
      onlineVacancies: event.vacancy_online,
      remainingPresentialVacancies: presentialVacanciesAvailable,
      remainingOnlineVacancies: onlineVacanciesAvailable,
      vacanciesPerBrand: event.vacancies_per_brand,
      companyRemainingPresentialVacancies: event.vacancies_per_brand - companyPresentialCount,
      freeOnline: event.free_online
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