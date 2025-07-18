"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
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
const EVENTS_PREFIX = "events/"

// Schema para validação
const eventSchema = z.object({
  title: z.string().min(1, { message: "Título é obrigatório" }),
  slug: z.string().min(1, { message: "Slug é obrigatório" }),
  summary: z.string().min(1, { message: "Resumo é obrigatório" }),
  description: z.string().min(1, { message: "Descrição é obrigatória" }),
  date: z.string().min(1, { message: "Data é obrigatória" }),
  start_time: z.string().min(1, { message: "Horário de início é obrigatório" }),
  end_time: z.string().min(1, { message: "Horário de fim é obrigatório" }),
  format: z.enum(['PRESENCIAL', 'ONLINE', 'HIBRIDO'], {
    message: "Formato deve ser PRESENCIAL, ONLINE ou HIBRIDO"
  }),
  vacancy_total: z.coerce.number().min(1, { message: "Total de vagas deve ser maior que 0" }),
  vacancies_per_brand: z.coerce.number().min(0, { message: "Vagas por marca deve ser maior ou igual a 0" }),
  minimum_quorum: z.coerce.number().min(0, { message: "Quórum mínimo deve ser maior ou igual a 0" }),
  highlight: z.preprocess((val) => val === "true" || val === true || val === "on", z.boolean().default(false)),
  isPublished: z.preprocess((val) => val === "true" || val === true || val === "on", z.boolean().default(false)),
  isStreaming: z.preprocess((val) => val === "true" || val === true || val === "on", z.boolean().default(false)),
  transmission_link: z.string().optional(),
  schedule_link: z.string().optional(),
  free_online: z.preprocess((val) => val === "true" || val === true || val === "on", z.boolean().default(false)),
  exclusive_for_members: z.preprocess((val) => val === "true" || val === true || val === "on", z.boolean().default(false)),
  // Campos do endereço
  street: z.string().min(1, { message: "Rua é obrigatória" }),
  number: z.string().min(1, { message: "Número é obrigatório" }),
  complement: z.string().optional(),
  postal_code: z.string().min(1, { message: "CEP é obrigatório" }),
  cityId: z.string().min(1, { message: "Cidade é obrigatória" }),
  stateId: z.string().min(1, { message: "Estado é obrigatório" }),
  speakerIds: z.string().optional(),
  sponsorIds: z.string().optional(),
  supporterIds: z.string().optional(),
})

/**
 * Faz upload da imagem para o bucket do MinIO
 */
async function uploadImageToMinIO(file: File, eventId: string, isThumb: boolean = false) {
  try {
    const extension = file.name.split('.').pop() || 'jpg'
    const uniqueId = nanoid(10)
    const prefix = isThumb ? 'thumb-' : ''
    const fileName = `${prefix}${Date.now()}-${uniqueId}.${extension}`
    const filePath = `${EVENTS_PREFIX}${eventId}/${fileName}`

    const buffer = await file.arrayBuffer()

    await minioClient.putObject(
      BUCKET_NAME,
      filePath,
      Buffer.from(buffer),
      file.size,
      {
        'Content-Type': file.type,
      }
    )

    const publicUrl = `https://s3.abfti.com.br/${BUCKET_NAME}/${filePath}`

    return {
      success: true,
      filePath,
      publicUrl
    }
  } catch (error) {
    console.error("Erro ao fazer upload de imagem:", error)
    return {
      success: false,
      error: String(error)
    }
  }
}

/**
 * Gera slug único baseado no título
 */
async function generateUniqueSlug(title: string, eventId?: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  let slug = baseSlug
  let counter = 1

  while (true) {
    const existingEvent = await prisma.events.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!existingEvent || (eventId && existingEvent.id === eventId)) {
      break
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * Cria ou atualiza um endereço
 */
async function upsertAddress(addressData: {
  street: string
  number: string
  complement?: string
  postal_code: string
  cityId: string
  stateId: string
}, existingAddressId?: string): Promise<string> {
  const addressId = existingAddressId || nanoid()
  
  if (existingAddressId) {
    // Atualizar endereço existente
    await prisma.address.update({
      where: { id: existingAddressId },
      data: {
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement || '',
        postal_code: addressData.postal_code,
        cityId: addressData.cityId,
        stateId: addressData.stateId,
        updatedAt: new Date()
      }
    })
  } else {
    // Criar novo endereço
    await prisma.address.create({
      data: {
        id: addressId,
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement || '',
        postal_code: addressData.postal_code,
        cityId: addressData.cityId,
        stateId: addressData.stateId,
        created_at: new Date(),
        updatedAt: new Date()
      }
    })
  }

  return addressId
}

export const upsertEvent = async (
  eventId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user, error } = await getAuthWithPermission("events.create")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Event.upsert", `Acesso negado: usuário não-admin tentou ${eventId ? 'atualizar' : 'criar'} evento`, user.id, {
      eventId,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Validar tamanho da requisição
    const totalSize = Array.from(formData.entries()).reduce((total, [key, value]) => {
      if (value instanceof File) {
        return total + value.size
      }
      return total + (typeof value === 'string' ? value.length : 0)
    }, 0)

    if (totalSize > 8 * 1024 * 1024) { // 8MB
      return toActionState("ERROR", "Tamanho total dos arquivos muito grande. Limite: 8MB")
    }

    const imageFile = formData.get("image_file") as File || null
    const thumbFile = formData.get("thumb_file") as File || null
    const formDataObject = Object.fromEntries(formData.entries())

    if (formDataObject.image_file) {
      delete formDataObject.image_file
    }
    if (formDataObject.thumb_file) {
      delete formDataObject.thumb_file
    }

    const data = eventSchema.parse(formDataObject)

    let newEventId = eventId
    let imageUploadResult = null
    let thumbUploadResult = null

    // Gerar slug único sempre baseado no título
    data.slug = await generateUniqueSlug(data.title, eventId)

    // Converter arrays de IDs
    const speakerIds = data.speakerIds ? data.speakerIds.split(',').filter(id => id.trim()) : []
    const sponsorIds = data.sponsorIds ? data.sponsorIds.split(',').filter(id => id.trim()) : []
    const supporterIds = data.supporterIds ? data.supporterIds.split(',').filter(id => id.trim()) : []

    // Preparar dados do endereço
    const addressData = {
      street: data.street,
      number: data.number,
      complement: data.complement,
      postal_code: data.postal_code,
      cityId: data.cityId,
      stateId: data.stateId
    }

    if (eventId) {
      // Atualizar evento existente
      const existingEvent = await prisma.events.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          image_url: true,
          addressId: true
        }
      })

      if (!existingEvent) {
        await logWarn("Event.update", `Tentativa de atualizar evento inexistente #${eventId}`, user.id, {
          eventId
        })
        return toActionState("ERROR", "Evento não encontrado")
      }

      const changes: any = {}
      if (existingEvent.title !== data.title) changes['title'] = { from: existingEvent.title, to: data.title }

      // Criar ou atualizar endereço
      const addressId = await upsertAddress(addressData, existingEvent.addressId)

      // Atualizar dados básicos do evento
      await prisma.events.update({
        where: { id: eventId },
        data: {
          title: data.title,
          slug: data.slug,
          summary: data.summary,
          description: data.description,
          date: new Date(data.date),
          start_time: data.start_time,
          end_time: data.end_time,
          format: data.format,
          vacancy_total: data.vacancy_total,
          vacancies_per_brand: data.vacancies_per_brand,
          minimum_quorum: data.minimum_quorum,
          highlight: data.highlight,
          isPublished: data.isPublished,
          isStreaming: data.isStreaming,
          transmission_link: data.transmission_link || '',
          schedule_link: data.schedule_link || '',
          free_online: data.free_online,
          exclusive_for_members: data.exclusive_for_members,
          addressId: addressId,
          updatedAt: new Date()
        }
      })

      // Upload de imagem principal se fornecida
      if (imageFile && imageFile.size > 0) {
        imageUploadResult = await uploadImageToMinIO(imageFile, eventId, false)

        if (imageUploadResult.success) {
          await prisma.events.update({
            where: { id: eventId },
            data: {
              image_url: imageUploadResult.publicUrl,
              image_path: imageUploadResult.filePath
            }
          })
          changes['image'] = { from: existingEvent.image_url, to: imageUploadResult.publicUrl }
        }
      }

      // Upload de miniatura se fornecida
      if (thumbFile && thumbFile.size > 0) {
        thumbUploadResult = await uploadImageToMinIO(thumbFile, eventId, true)

        if (thumbUploadResult.success) {
          await prisma.events.update({
            where: { id: eventId },
            data: {
              thumb_url: thumbUploadResult.publicUrl,
              thumb_path: thumbUploadResult.filePath
            }
          })
          changes['thumb'] = { to: thumbUploadResult.publicUrl }
        }
      }

      // Atualizar relacionamentos
      await updateEventRelationships(eventId, speakerIds, sponsorIds, supporterIds)

      await logInfo("Event.update", `Evento #${eventId} atualizado: ${data.title}`, user.id, {
        eventId,
        eventTitle: data.title,
        changes,
        imageUploaded: imageFile ? true : false
      })

    } else {
      // Criar novo evento
      newEventId = nanoid()

      let imageUrl = ""
      let imagePath = ""
      let thumbUrl = ""
      let thumbPath = ""

      // Upload da imagem principal
      if (imageFile && imageFile.size > 0) {
        imageUploadResult = await uploadImageToMinIO(imageFile, newEventId, false)

        if (imageUploadResult.success && imageUploadResult.publicUrl) {
          imageUrl = imageUploadResult.publicUrl
          imagePath = imageUploadResult.filePath
        } else {
          await logWarn("Event.create", `Erro ao fazer upload de imagem para o novo evento #${newEventId}`, user.id, {
            eventId: newEventId,
            error: imageUploadResult.error
          })
          return toActionState("ERROR", "Erro ao fazer upload da imagem do evento")
        }
      }

      // Upload da miniatura
      if (thumbFile && thumbFile.size > 0) {
        thumbUploadResult = await uploadImageToMinIO(thumbFile, newEventId, true)

        if (thumbUploadResult.success && thumbUploadResult.publicUrl) {
          thumbUrl = thumbUploadResult.publicUrl
          thumbPath = thumbUploadResult.filePath
        } else {
          await logWarn("Event.create", `Erro ao fazer upload de miniatura para o novo evento #${newEventId}`, user.id, {
            eventId: newEventId,
            error: thumbUploadResult.error
          })
          // Não retornar erro, miniatura é opcional
        }
      }

      // Criar endereço
      const addressId = await upsertAddress(addressData)

      // Criar evento
      await prisma.events.create({
        data: {
          id: newEventId,
          title: data.title,
          slug: data.slug,
          image_url: imageUrl,
          image_path: imagePath,
          thumb_url: thumbUrl,
          thumb_path: thumbPath,
          ticket_img_path: imagePath,
          summary: data.summary,
          description: data.description,
          date: new Date(data.date),
          start_time: data.start_time,
          end_time: data.end_time,
          format: data.format,
          vacancy_total: data.vacancy_total,
          vacancies_per_brand: data.vacancies_per_brand,
          minimum_quorum: data.minimum_quorum,
          highlight: data.highlight,
          isPublished: data.isPublished,
          isStreaming: data.isStreaming,
          transmission_link: data.transmission_link || '',
          schedule_link: data.schedule_link || '',
          free_online: data.free_online,
          exclusive_for_members: data.exclusive_for_members,
          addressId: addressId,
          created_at: new Date(),
          updatedAt: new Date()
        }
      })

      // Criar relacionamentos
      await updateEventRelationships(newEventId, speakerIds, sponsorIds, supporterIds)

      await logInfo("Event.create", `Novo evento criado: ${data.title}`, user.id, {
        eventId: newEventId,
        eventTitle: data.title,
        imageUploaded: imageFile ? true : false
      })

      eventId = newEventId
    }

    revalidatePath('/admin/events')
    if (eventId) {
      revalidatePath(`/admin/events/${eventId}`)
    }
    revalidatePath('/') // Revalidar página inicial

  } catch (error) {
    await logError("Event.upsert", `Erro ao ${eventId ? 'atualizar' : 'criar'} evento`, user.id, {
      eventId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })
    return fromErrorToActionState(error, formData)
  }
  
  // Redirect deve ficar fora do try-catch para não ser capturado
  if (eventId) {
    redirect(`/admin/events/${eventId}`)
  }

  return toActionState("SUCCESS", "Evento salvo com sucesso")
}

/**
 * Atualiza os relacionamentos do evento (speakers, sponsors, supporters)
 */
async function updateEventRelationships(
  eventId: string,
  speakerIds: string[],
  sponsorIds: string[],
  supporterIds: string[]
) {
  await prisma.$transaction(async (tx) => {
    // Desconectar todos os relacionamentos existentes
    await tx.events.update({
      where: { id: eventId },
      data: {
        speakers: { set: [] },
        sponsors: { set: [] },
        supporters: { set: [] }
      }
    })

    // Reconectar com novos IDs
    if (speakerIds.length > 0) {
      await tx.events.update({
        where: { id: eventId },
        data: {
          speakers: {
            connect: speakerIds.map(id => ({ id }))
          }
        }
      })
    }

    if (sponsorIds.length > 0) {
      await tx.events.update({
        where: { id: eventId },
        data: {
          sponsors: {
            connect: sponsorIds.map(id => ({ id }))
          }
        }
      })
    }

    if (supporterIds.length > 0) {
      await tx.events.update({
        where: { id: eventId },
        data: {
          supporters: {
            connect: supporterIds.map(id => ({ id }))
          }
        }
      })
    }
  })
}