// /features/supporters/actions/upsert-supporter.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { revalidatePath } from "next/cache"
import { supportersPath, supporterPath } from "@/app/paths"
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
// Seguindo o padrão existente: images/supporters/full_size/{id do supporter}
const SUPPORTERS_IMAGE_PREFIX = "eventos/images/supporters/full_size/"

// Schema para validação
const supporterSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  active: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().default(true)
  ),
  // Campos de imagem
  image_url: z.string().optional(),
  image_path: z.string().optional(),
  thumb_path: z.string().optional(),
})

/**
 * Faz upload da imagem para o bucket S3 do MinIO
 * Seguindo o padrão: images/supporters/full_size/{id do supporter}/{filename}
 */
async function uploadImageToMinIO(file: File, supporterId: string) {
  try {
    // Usar o nome original do arquivo, conforme padrão existente
    const fileName = file.name
    const filePath = `${SUPPORTERS_IMAGE_PREFIX}${supporterId}/${fileName}`

    // Ler o arquivo como buffer
    const buffer = await file.arrayBuffer()

    // Enviar o arquivo para o MinIO
    await minioClient.putObject(
      BUCKET_NAME,
      filePath,
      Buffer.from(buffer),
      file.size,
      {
        'Content-Type': file.type,
      }
    )

    // URL pública da imagem
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

export const upsertSupporter = async (
  supporterId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user } = await getAuthOrRedirect()

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Supporter.upsert", `Acesso negado: usuário não-admin tentou ${supporterId ? 'atualizar' : 'criar'} apoiador`, user.id, {
      supporterId,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Extrair o arquivo de imagem do FormData
    const imageFile = formData.get("image_file") as File || null

    // Preparar os dados base do apoiador (sem imagem)
    const formDataObject = Object.fromEntries(formData.entries())

    // Remover o campo de arquivo para não interferir na validação
    if (formDataObject.image_file) {
      delete formDataObject.image_file
    }

    // Validar os dados do apoiador
    const data = supporterSchema.parse(formDataObject)

    let newSupporterId = supporterId
    let imageUploadResult = null

    // Se é uma atualização, verificar se o apoiador existe
    if (supporterId) {
      const existingSupporter = await prisma.supporters.findUnique({
        where: { id: supporterId }
      })

      if (!existingSupporter) {
        await logWarn("Supporter.update", `Tentativa de atualizar apoiador inexistente #${supporterId}`, user.id, {
          supporterId
        })
        return toActionState("ERROR", "Apoiador não encontrado")
      }

      // Para o log, preparamos as alterações significativas
      const changes: any = {}

      if (existingSupporter.name !== data.name) changes['name'] = { from: existingSupporter.name, to: data.name }
      if (existingSupporter.active !== data.active) changes['active'] = { from: existingSupporter.active, to: data.active }

      // 1. Primeiro atualizamos o apoiador sem os dados de imagem
      await prisma.supporters.update({
        where: { id: supporterId },
        data: {
          name: data.name,
          active: data.active,
          updatedAt: new Date()
        }
      })

      // 2. Se tiver um arquivo de imagem, fazemos o upload
      if (imageFile && imageFile.size > 0) {
        imageUploadResult = await uploadImageToMinIO(imageFile, supporterId)

        if (imageUploadResult.success) {
          // 3. Atualizamos o apoiador com os dados da imagem
          await prisma.supporters.update({
            where: { id: supporterId },
            data: {
              image_url: imageUploadResult.publicUrl,
              image_path: imageUploadResult.filePath,
              thumb_url: imageUploadResult.publicUrl, // Usar mesma URL para miniatura
              thumb_path: imageUploadResult.filePath, // Usar mesmo caminho para miniatura
            }
          })

          changes['image'] = { from: existingSupporter.image_url, to: imageUploadResult.publicUrl }
        } else {
          await logWarn("Supporter.update", `Erro ao fazer upload de imagem para o apoiador #${supporterId}`, user.id, {
            supporterId,
            error: imageUploadResult.error
          })
        }
      }

      await logInfo("Supporter.update", `Apoiador #${supporterId} atualizado: ${data.name}`, user.id, {
        supporterId,
        supporterName: data.name,
        changes,
        imageUploaded: imageFile ? true : false
      })

    } else {
      // Criar novo apoiador
      newSupporterId = nanoid()

      // 1. Primeiro criamos o apoiador sem os dados de imagem
      await prisma.supporters.create({
        data: {
          id: newSupporterId,
          name: data.name,
          active: data.active,
          image_url: "",
          thumb_url: "",
          image_path: "",
          thumb_path: "",
          created_at: new Date(),
          updatedAt: new Date()
        }
      })

      // 2. Se tiver um arquivo de imagem, fazemos o upload
      if (imageFile && imageFile.size > 0) {
        imageUploadResult = await uploadImageToMinIO(imageFile, newSupporterId)

        if (imageUploadResult.success) {
          // 3. Atualizamos o apoiador com os dados da imagem
          await prisma.supporters.update({
            where: { id: newSupporterId },
            data: {
              image_url: imageUploadResult.publicUrl,
              image_path: imageUploadResult.filePath,
              thumb_url: imageUploadResult.publicUrl,
              thumb_path: imageUploadResult.filePath
            }
          })
        } else {
          await logWarn("Supporter.create", `Erro ao fazer upload de imagem para o novo apoiador #${newSupporterId}`, user.id, {
            supporterId: newSupporterId,
            error: imageUploadResult.error
          })
        }
      }

      await logInfo("Supporter.create", `Novo apoiador criado: ${data.name}`, user.id, {
        supporterId: newSupporterId,
        supporterName: data.name,
        imageUploaded: imageFile ? true : false
      })

      // Atualizar o ID do apoiador para o redirecionamento
      supporterId = newSupporterId
    }

    revalidatePath(supportersPath())
    if (supporterId) {
      revalidatePath(supporterPath(supporterId))
    }

  } catch (error) {
    await logError("Supporter.upsert", `Erro ao ${supporterId ? 'atualizar' : 'criar'} apoiador`, user.id, {
      supporterId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })
    return fromErrorToActionState(error, formData)
  }

  if (supporterId) {
    redirect(supporterPath(supporterId))
  }

  return toActionState("SUCCESS", "Apoiador salvo com sucesso")
}