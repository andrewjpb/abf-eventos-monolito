// /features/banners/actions/upsert-banner.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { revalidatePath } from "next/cache"
import { bannerPath, bannersPath } from "@/app/paths"
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

const BUCKET_NAME = "abf-ti"
const BANNERS_PREFIX = "banners/"

// Schema para validação
const bannerSchema = z.object({
  title: z.string().min(1, { message: "Título do banner é obrigatório" }),
  image_url: z.string().optional(),
  external_link: z.string().min(1, { message: "Link externo é obrigatório" }),
  active: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().default(true)
  ),
});

/**
 * Faz upload da imagem para o bucket do MinIO
 */
async function uploadImageToMinIO(file: File, bannerId: string) {
  try {
    // Gerar nome único para o arquivo
    const extension = file.name.split('.').pop() || 'jpg'
    const uniqueId = nanoid(10)
    const fileName = `${Date.now()}-${uniqueId}.${extension}`
    const filePath = `${BANNERS_PREFIX}${bannerId}/${fileName}`

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

export const upsertBanner = async (
  bannerId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user, error } = await getAuthWithPermission("banners.create")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin")
  if (!isAdmin) {
    await logWarn("Banner.upsert", `Acesso negado: usuário não-admin tentou ${bannerId ? 'atualizar' : 'criar'} banner`, user.id, {
      bannerId,
      isAdmin
    })
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Extrair o arquivo de imagem do FormData
    const imageFile = formData.get("image_file") as File || null

    // Preparar os dados base do banner (sem imagem)
    const formDataObject = Object.fromEntries(formData.entries())

    // Remover o campo de arquivo para não interferir na validação
    if (formDataObject.image_file) {
      delete formDataObject.image_file
    }

    // Validar os dados do banner
    const data = bannerSchema.parse(formDataObject)

    let newBannerId = bannerId
    let imageUploadResult = null

    // Se é uma atualização, verificar se o banner existe
    if (bannerId) {
      const existingBanner = await prisma.highlight_card.findUnique({
        where: { id: bannerId },
        select: {
          id: true,
          title: true,
          image_url: true
        }
      })

      if (!existingBanner) {
        await logWarn("Banner.update", `Tentativa de atualizar banner inexistente #${bannerId}`, user.id, {
          bannerId
        })
        return toActionState("ERROR", "Banner não encontrado")
      }

      // Para o log, preparamos as alterações significativas
      const changes: any = {}

      if (existingBanner.title !== data.title) changes['title'] = { from: existingBanner.title, to: data.title }

      // 1. Primeiro atualizamos o banner sem os dados de imagem
      await prisma.highlight_card.update({
        where: { id: bannerId },
        data: {
          title: data.title,
          external_link: data.external_link,
          active: data.active,
          updatedAt: new Date()
        }
      })

      // 2. Se tiver um arquivo de imagem, fazemos o upload
      if (imageFile && imageFile.size > 0) {
        imageUploadResult = await uploadImageToMinIO(imageFile, bannerId)

        if (imageUploadResult.success) {
          // 3. Atualizamos o banner com os dados da imagem
          await prisma.highlight_card.update({
            where: { id: bannerId },
            data: {
              image_url: imageUploadResult.publicUrl
            }
          })

          changes['image'] = { from: existingBanner.image_url, to: imageUploadResult.publicUrl }
        } else {
          await logWarn("Banner.update", `Erro ao fazer upload de imagem para o banner #${bannerId}`, user.id, {
            bannerId,
            error: imageUploadResult.error
          })
        }
      }

      await logInfo("Banner.update", `Banner #${bannerId} atualizado: ${data.title}`, user.id, {
        bannerId,
        bannerTitle: data.title,
        changes,
        imageUploaded: imageFile ? true : false
      })

    } else {
      // Criar novo banner
      newBannerId = nanoid()

      // 1. Se tiver uma imagem para upload, fazemos o upload primeiro
      let imageUrl = data.image_url || ""

      if (imageFile && imageFile.size > 0) {
        imageUploadResult = await uploadImageToMinIO(imageFile, newBannerId)

        if (imageUploadResult.success && imageUploadResult.publicUrl) {
          imageUrl = imageUploadResult.publicUrl
        } else {
          await logWarn("Banner.create", `Erro ao fazer upload de imagem para o novo banner #${newBannerId}`, user.id, {
            bannerId: newBannerId,
            error: imageUploadResult.error
          })
          return toActionState("ERROR", "Erro ao fazer upload da imagem do banner")
        }
      }

      if (!imageUrl) {
        return toActionState("ERROR", "É necessário fornecer uma imagem para o banner")
      }

      // 2. Criamos o banner com todos os dados
      await prisma.highlight_card.create({
        data: {
          id: newBannerId,
          title: data.title,
          image_url: imageUrl,
          external_link: data.external_link,
          active: data.active,
          created_at: new Date(),
          updatedAt: new Date()
        }
      })

      await logInfo("Banner.create", `Novo banner criado: ${data.title}`, user.id, {
        bannerId: newBannerId,
        bannerTitle: data.title,
        imageUploaded: imageFile ? true : false
      })

      // Atualizar o ID do banner para o redirecionamento
      bannerId = newBannerId
    }

    revalidatePath(bannersPath())
    if (bannerId) {
      revalidatePath(bannerPath(bannerId))
    }

    revalidatePath('/') // Revalidar a página inicial onde banners são exibidos

    if (bannerId) {
      return redirect(bannerPath(bannerId))
    }

    return toActionState("SUCCESS", "Banner salvo com sucesso")

  } catch (error) {
    await logError("Banner.upsert", `Erro ao ${bannerId ? 'atualizar' : 'criar'} banner`, user.id, {
      bannerId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })
    return fromErrorToActionState(error, formData)
  }
}