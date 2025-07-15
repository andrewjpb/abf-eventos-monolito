// /features/sponsors/actions/upsert-sponsor.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { revalidatePath } from "next/cache"
import { sponsorsPath, sponsorPath } from "@/app/paths"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import * as Minio from 'minio'
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"

// Cliente MinIO
const minioClient = new Minio.Client({
  endPoint: '10.0.0.23',
  port: 9001,
  useSSL: false,
  accessKey: process.env.S3_ACCESS_KEY_ID,
  secretKey: process.env.S3_SECRET_ACCESS_KEY,
})

const BUCKET_NAME = "eventos"
// Seguindo o padrão existente: images/sponsors/full_size/{id do sponsor}
const SPONSORS_IMAGE_PREFIX = "eventos/images/sponsors/full_size/"

// Schema para validação
const sponsorSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  description: z.string().optional(),
  active: z.preprocess(
    (val) => val === "true" || val === true || val === "on",
    z.boolean().default(true)
  ),
  // Campos de imagem
  image_url: z.string().optional(),
  image_path: z.string().optional(),
  thumb_path: z.string().optional(),
})

/**
 * Faz upload da imagem para o bucket S3 do MinIO
 * Seguindo o padrão: images/sponsors/full_size/{id do sponsor}/{filename}
 */
async function uploadImageToMinIO(file: File, sponsorId: string) {
  try {
    // Usar o nome original do arquivo, conforme padrão existente
    const fileName = file.name
    const filePath = `${SPONSORS_IMAGE_PREFIX}${sponsorId}/${fileName}`

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

export const upsertSponsor = async (
  sponsorId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user, error } = await getAuthWithPermission("sponsors.create")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Sponsor.upsert", `Acesso negado: usuário não-admin tentou ${sponsorId ? 'atualizar' : 'criar'} patrocinador`, user.id, {
      sponsorId,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Extrair o arquivo de imagem do FormData
    const imageFile = formData.get("image_file") as File || null

    // Preparar os dados base do patrocinador (sem imagem)
    const formDataObject = Object.fromEntries(formData.entries())

    // Remover o campo de arquivo para não interferir na validação
    if (formDataObject.image_file) {
      delete formDataObject.image_file
    }

    // Validar os dados do patrocinador
    const data = sponsorSchema.parse(formDataObject)

    let newSponsorId = sponsorId
    let imageUploadResult = null

    // Se é uma atualização, verificar se o patrocinador existe
    if (sponsorId) {
      const existingSponsor = await prisma.sponsors.findUnique({
        where: { id: sponsorId }
      })

      if (!existingSponsor) {
        await logWarn("Sponsor.update", `Tentativa de atualizar patrocinador inexistente #${sponsorId}`, user.id, {
          sponsorId
        })
        return toActionState("ERROR", "Patrocinador não encontrado")
      }

      // Para o log, preparamos as alterações significativas
      const changes: any = {}

      if (existingSponsor.name !== data.name) changes['name'] = { from: existingSponsor.name, to: data.name }
      if (existingSponsor.description !== data.description) changes['description'] = { from: existingSponsor.description, to: data.description }
      if (existingSponsor.active !== data.active) changes['active'] = { from: existingSponsor.active, to: data.active }

      // 1. Primeiro atualizamos o patrocinador sem os dados de imagem
      await prisma.sponsors.update({
        where: { id: sponsorId },
        data: {
          name: data.name,
          description: data.description || null,
          active: data.active,
          updatedAt: new Date()
        }
      })

      // 2. Se tiver um arquivo de imagem, fazemos o upload
      if (imageFile && imageFile.size > 0) {
        imageUploadResult = await uploadImageToMinIO(imageFile, sponsorId)

        if (imageUploadResult.success) {
          // 3. Atualizamos o patrocinador com os dados da imagem
          await prisma.sponsors.update({
            where: { id: sponsorId },
            data: {
              image_url: imageUploadResult.publicUrl,
              image_path: imageUploadResult.filePath,
              thumb_url: imageUploadResult.publicUrl, // Usar mesma URL para miniatura
              thumb_path: imageUploadResult.filePath, // Usar mesmo caminho para miniatura
            }
          })

          changes['image'] = { from: existingSponsor.image_url, to: imageUploadResult.publicUrl }
        } else {
          await logWarn("Sponsor.update", `Erro ao fazer upload de imagem para o patrocinador #${sponsorId}`, user.id, {
            sponsorId,
            error: imageUploadResult.error
          })
        }
      }

      await logInfo("Sponsor.update", `Patrocinador #${sponsorId} atualizado: ${data.name}`, user.id, {
        sponsorId,
        sponsorName: data.name,
        changes,
        imageUploaded: imageFile ? true : false
      })

    } else {
      // Criar novo patrocinador
      newSponsorId = nanoid()

      // 1. Primeiro criamos o patrocinador sem os dados de imagem
      await prisma.sponsors.create({
        data: {
          id: newSponsorId,
          name: data.name,
          description: data.description || null,
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
        imageUploadResult = await uploadImageToMinIO(imageFile, newSponsorId)

        if (imageUploadResult.success) {
          // 3. Atualizamos o patrocinador com os dados da imagem
          await prisma.sponsors.update({
            where: { id: newSponsorId },
            data: {
              image_url: imageUploadResult.publicUrl,

            }
          })
        } else {
          await logWarn("Sponsor.create", `Erro ao fazer upload de imagem para o novo patrocinador #${newSponsorId}`, user.id, {
            sponsorId: newSponsorId,
            error: imageUploadResult.error
          })
        }
      }

      await logInfo("Sponsor.create", `Novo patrocinador criado: ${data.name}`, user.id, {
        sponsorId: newSponsorId,
        sponsorName: data.name,
        description: data.description,
        imageUploaded: imageFile ? true : false
      })

      // Atualizar o ID do patrocinador para o redirecionamento
      sponsorId = newSponsorId
    }

    revalidatePath(sponsorsPath())
    if (sponsorId) {
      revalidatePath(sponsorPath(sponsorId))
    }

  } catch (error) {
    await logError("Sponsor.upsert", `Erro ao ${sponsorId ? 'atualizar' : 'criar'} patrocinador`, user.id, {
      sponsorId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })
    return fromErrorToActionState(error, formData)
  }

  if (sponsorId) {
    redirect(sponsorPath(sponsorId))
  }

  return toActionState("SUCCESS", "Patrocinador salvo com sucesso")
}