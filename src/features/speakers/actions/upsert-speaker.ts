// /features/speakers/actions/upsert-speaker.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import { revalidatePath } from "next/cache"
import { speakersPath, speakerPath } from "@/app/paths"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"

// Schema para validação
const speakerSchema = z.object({
  description: z.string().optional(),
  userId: z.string().min(1, { message: "Usuário é obrigatório" }),
})

export const upsertSpeaker = async (
  speakerId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user, error } = await getAuthWithPermission("speakers.create")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Speaker.upsert", `Acesso negado: usuário não-admin tentou ${speakerId ? 'atualizar' : 'criar'} palestrante`, user.id, {
      speakerId,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Preparar os dados do palestrante
    const formDataObject = Object.fromEntries(formData.entries())

    // Validar os dados do palestrante
    const data = speakerSchema.parse(formDataObject)

    // Verificar se o usuário existe
    const userExists = await prisma.users.findUnique({
      where: { id: data.userId },
      select: { id: true, name: true }
    })

    if (!userExists) {
      return toActionState("ERROR", "O usuário selecionado não existe")
    }

    // Verificar se o usuário já é um palestrante em qualquer registro
    const existingSpeakerWithUser = await prisma.speakers.findFirst({
      where: {
        moderatorId: data.userId,
        // Se for edição, excluir o palestrante atual da verificação
        ...(speakerId ? { id: { not: speakerId } } : {})
      }
    })

    if (existingSpeakerWithUser) {
      await logWarn("Speaker.upsert", `Tentativa de associar usuário que já é palestrante`, user.id, {
        speakerId,
        userId: data.userId,
        existingSpeakerId: existingSpeakerWithUser.id
      })
      return toActionState("ERROR", "Este usuário já está associado como palestrante em outro registro")
    }

    let newSpeakerId = speakerId

    // Se é uma atualização, verificar se o palestrante existe
    if (speakerId) {
      const existingSpeaker = await prisma.speakers.findUnique({
        where: { id: speakerId },
        include: {
          users: {
            select: { name: true }
          }
        }
      })

      if (!existingSpeaker) {
        await logWarn("Speaker.update", `Tentativa de atualizar palestrante inexistente #${speakerId}`, user.id, {
          speakerId
        })
        return toActionState("ERROR", "Palestrante não encontrado")
      }

      // Para o log, preparamos as alterações significativas
      const changes: any = {}

      if (existingSpeaker.description !== data.description) {
        changes['description'] = { from: existingSpeaker.description, to: data.description }
      }

      if (existingSpeaker.moderatorId !== data.userId) {
        changes['userId'] = { from: existingSpeaker.moderatorId, to: data.userId }
      }

      // Atualizar o palestrante
      await prisma.speakers.update({
        where: { id: speakerId },
        data: {
          description: data.description || null,
          moderatorId: data.userId,
          updatedAt: new Date()
        }
      })

      await logInfo("Speaker.update", `Palestrante #${speakerId} atualizado: ${userExists.name}`, user.id, {
        speakerId,
        speakerName: userExists.name,
        changes
      })

    } else {
      // Criar novo palestrante
      newSpeakerId = nanoid()

      await prisma.speakers.create({
        data: {
          id: newSpeakerId,
          description: data.description || null,
          moderatorId: data.userId,
          created_at: new Date(),
          updatedAt: new Date()
        }
      })

      await logInfo("Speaker.create", `Novo palestrante criado: ${userExists.name}`, user.id, {
        speakerId: newSpeakerId,
        speakerName: userExists.name,
        description: data.description
      })

      // Atualizar o ID do palestrante para o redirecionamento
      speakerId = newSpeakerId
    }

    revalidatePath(speakersPath())
    if (speakerId) {
      revalidatePath(speakerPath(speakerId))
    }

  } catch (error) {
    await logError("Speaker.upsert", `Erro ao ${speakerId ? 'atualizar' : 'criar'} palestrante`, user.id, {
      speakerId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })
    return fromErrorToActionState(error, formData)
  }

  if (speakerId) {
    redirect(speakerPath(speakerId))
  }

  return toActionState("SUCCESS", "Palestrante salvo com sucesso")
}