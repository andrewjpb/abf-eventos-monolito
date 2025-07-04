"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { revalidatePath } from "next/cache"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import * as Minio from 'minio'
import { z } from "zod"

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

// Schema para validação da imagem
const imageSchema = z.object({
  image_file: z.any()
    .refine(file => file !== null && file !== undefined, {
      message: "É necessário fornecer uma imagem para o evento"
    })
})

/**
 * Gera um nome de arquivo único para o upload
 */
const generateUniqueFileName = (originalName: string = "image.jpg"): string => {
  const extension = originalName.split('.').pop() || 'jpg'
  const uniqueId = nanoid(10)
  return `${Date.now()}-${uniqueId}.${extension}`
}

/**
 * Função otimizada para obter o buffer do arquivo
 */
async function getFileBuffer(file: any): Promise<{ buffer: Buffer, type: string, size: number, name: string }> {
  if (file instanceof Blob || (typeof file === 'object' && file !== null && 'arrayBuffer' in file && typeof file.arrayBuffer === 'function')) {
    const buffer = Buffer.from(await file.arrayBuffer())
    return {
      buffer,
      type: file.type || 'image/jpeg',
      size: buffer.length,
      name: file.name || 'image.jpg'
    }
  }

  if (Buffer.isBuffer(file)) {
    return {
      buffer: file,
      type: 'application/octet-stream',
      size: file.length,
      name: 'buffer.bin'
    }
  }

  if (typeof file === 'object' && file !== null) {
    const actualFile = file.valueOf?.() ?? file

    if (actualFile instanceof Blob || 'arrayBuffer' in actualFile) {
      return getFileBuffer(actualFile)
    }

    if (typeof file.stream === 'function') {
      const chunks = []
      for await (const chunk of file.stream()) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)
      return {
        buffer,
        type: file.type || 'application/octet-stream',
        size: buffer.length,
        name: file.name || 'streamed-file.bin'
      }
    }

    if (file.data && Buffer.isBuffer(file.data)) {
      return {
        buffer: file.data,
        type: file.type || 'application/octet-stream',
        size: file.data.length,
        name: file.name || 'data-file.bin'
      }
    }
  }

  const stringData = String(file)
  const buffer = Buffer.from(stringData)
  return {
    buffer,
    type: 'text/plain',
    size: buffer.length,
    name: 'text-file.txt'
  }
}

export const updateEventImage = async (
  eventId: string,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user, error } = await getAuthWithPermission("events.update")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Event.updateImage", `Acesso negado: usuário não-admin tentou atualizar imagem do evento`, user.id, {
      eventId,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Buscar o evento para verificar se existe
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: { 
        id: true, 
        title: true, 
        image_url: true,
        image_path: true
      }
    })

    if (!event) {
      await logWarn("Event.updateImage", `Tentativa de atualizar imagem de evento inexistente #${eventId}`, user.id, {
        eventId
      })
      return toActionState("ERROR", "Evento não encontrado")
    }

    // Obter o FormData como objeto e validar
    const formDataObject = Object.fromEntries(formData.entries())

    try {
      imageSchema.parse(formDataObject)
    } catch (validationError) {
      return fromErrorToActionState(validationError, formData)
    }

    // Extrair o arquivo de imagem do FormData
    const fileData = formData.get("image_file")

    if (!fileData) {
      return toActionState("ERROR", "É necessário fornecer uma imagem para o evento")
    }

    // Validar o tipo de arquivo
    if (fileData instanceof File) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(fileData.type)) {
        return toActionState("ERROR", "Formato de arquivo inválido. Apenas JPG, PNG, GIF e WEBP são aceitos.")
      }

      if (fileData.size > 10 * 1024 * 1024) { // 10MB
        return toActionState("ERROR", "Arquivo muito grande. O tamanho máximo permitido é 10MB.")
      }
    }

    // Extrair informações do arquivo
    const { buffer, type, size, name } = await getFileBuffer(fileData)

    // Gerar nome único para o arquivo
    const fileName = generateUniqueFileName(name)
    const filePath = `${EVENTS_PREFIX}${eventId}/${fileName}`

    try {
      console.log(`Enviando arquivo para ${BUCKET_NAME}/${filePath}`)

      // Importante: Enviar o buffer como stream para garantir integridade
      const stream = require('stream')
      const bufferStream = new stream.PassThrough()
      bufferStream.end(buffer)

      // Enviar o arquivo para o MinIO como stream
      await minioClient.putObject(
        BUCKET_NAME,
        filePath,
        bufferStream,
        size,
        {
          'Content-Type': type,
        }
      )

      // Aguardar um momento para garantir que o upload foi concluído
      await new Promise(resolve => setTimeout(resolve, 500))

      // URL pública da imagem
      const publicUrl = `https://s3.abfti.com.br/${BUCKET_NAME}/${filePath}`

      // Atualizar o URL da imagem no evento
      await prisma.events.update({
        where: { id: eventId },
        data: {
          image_url: publicUrl,
          image_path: filePath,
          thumb_url: publicUrl, // Por enquanto, usar a mesma URL
          thumb_path: filePath,
          updatedAt: new Date()
        }
      })

      await logInfo("Event.updateImage", `Imagem do evento #${eventId} atualizada`, user.id, {
        eventId,
        eventTitle: event.title,
        oldImageUrl: event.image_url,
        newImageUrl: publicUrl,
        filePath,
        fileName,
        fileSize: size,
        fileType: type
      })

      // Revalidar as páginas necessárias
      revalidatePath('/admin/events')
      revalidatePath(`/admin/events/${eventId}`)
      revalidatePath('/') // Página inicial onde eventos podem aparecer

      return toActionState("SUCCESS", "Imagem do evento atualizada com sucesso")
      
    } catch (uploadError) {
      console.error("Erro ao fazer upload para o MinIO:", uploadError)
      await logError("Event.updateImage", `Erro no upload para MinIO #${eventId}`, user.id, {
        eventId,
        error: String(uploadError),
        buffer_length: buffer.length
      })
      return toActionState("ERROR", `Erro ao fazer upload da imagem: ${uploadError}`)
    }
    
  } catch (error) {
    await logError("Event.updateImage", `Erro ao atualizar imagem do evento #${eventId}`, user.id, {
      eventId,
      error: String(error)
    })
    console.error("Erro ao atualizar imagem do evento:", error)
    return fromErrorToActionState(error, formData)
  }
}