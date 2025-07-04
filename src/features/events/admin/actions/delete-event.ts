"use server"

import { ActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import * as Minio from 'minio'

// Cliente MinIO
const minioClient = new Minio.Client({
  endPoint: '10.0.0.23',
  port: 9001,
  useSSL: false,
  accessKey: process.env.S3_ACCESS_KEY_ID,
  secretKey: process.env.S3_SECRET_ACCESS_KEY,
})

const BUCKET_NAME = "eventos"

/**
 * Remove imagens do evento do MinIO
 */
async function removeEventImages(imagePath: string) {
  try {
    if (imagePath) {
      await minioClient.removeObject(BUCKET_NAME, imagePath)
    }
    return { success: true }
  } catch (error) {
    console.error("Erro ao remover imagem do MinIO:", error)
    return { success: false, error: String(error) }
  }
}

export const deleteEvent = async (
  eventId: string,
  _actionState: ActionState,
  _formData: FormData
) => {
  const { user, error } = await getAuthWithPermission("events.delete")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Event.delete", `Acesso negado: usuário não-admin tentou deletar evento`, user.id, {
      eventId,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Buscar o evento para verificar se existe e obter informações para log
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        image_path: true,
        thumb_path: true,
        ticket_img_path: true,
        _count: {
          select: {
            attendance_list: true,
            speakers: true,
            sponsors: true,
            supporters: true
          }
        }
      }
    })

    if (!event) {
      await logWarn("Event.delete", `Tentativa de deletar evento inexistente #${eventId}`, user.id, {
        eventId
      })
      return toActionState("ERROR", "Evento não encontrado")
    }

    // Verificar se há inscrições no evento
    if (event._count.attendance_list > 0) {
      await logWarn("Event.delete", `Tentativa de deletar evento com inscrições #${eventId}`, user.id, {
        eventId,
        enrollments: event._count.attendance_list
      })
      return toActionState("ERROR", 
        `Não é possível deletar o evento "${event.title}" pois há ${event._count.attendance_list} inscrição(ões) associada(s).`
      )
    }

    // Remover relacionamentos primeiro (para evitar constraint errors)
    await prisma.events.update({
      where: { id: eventId },
      data: {
        speakers: { set: [] },
        sponsors: { set: [] },
        supporters: { set: [] }
      }
    })

    // Deletar o evento
    await prisma.events.delete({
      where: { id: eventId }
    })

    // Tentar remover imagens do MinIO (não bloquear se falhar)
    const imageRemovalPromises = []
    if (event.image_path) {
      imageRemovalPromises.push(removeEventImages(event.image_path))
    }
    if (event.thumb_path && event.thumb_path !== event.image_path) {
      imageRemovalPromises.push(removeEventImages(event.thumb_path))
    }
    if (event.ticket_img_path && event.ticket_img_path !== event.image_path && event.ticket_img_path !== event.thumb_path) {
      imageRemovalPromises.push(removeEventImages(event.ticket_img_path))
    }

    if (imageRemovalPromises.length > 0) {
      try {
        await Promise.all(imageRemovalPromises)
      } catch (imageError) {
        // Log do erro, mas não falhar a operação
        await logWarn("Event.delete", `Erro ao remover imagens do evento #${eventId}`, user.id, {
          eventId,
          imageError: String(imageError)
        })
      }
    }

    await logInfo("Event.delete", `Evento #${eventId} deletado: ${event.title}`, user.id, {
      eventId,
      eventTitle: event.title,
      hadRelationships: {
        speakers: event._count.speakers,
        sponsors: event._count.sponsors,
        supporters: event._count.supporters
      }
    })

    revalidatePath('/admin/events')
    revalidatePath('/') // Revalidar página inicial

    return redirect('/admin/events')

  } catch (error) {
    await logError("Event.delete", `Erro ao deletar evento #${eventId}`, user.id, {
      eventId,
      error: String(error)
    })
    
    // Verificar se é erro de constraint (relacionamentos)
    if (String(error).includes('foreign key constraint')) {
      return toActionState("ERROR", "Não é possível deletar o evento pois há dados relacionados")
    }
    
    return toActionState("ERROR", "Erro interno do servidor ao deletar evento")
  }
}