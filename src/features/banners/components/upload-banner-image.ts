// /features/banners/actions/upload-banner-image.ts
"use server"

import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { logError, logInfo } from "@/features/logs/queries/add-log"
import { minioClient, S3_BUCKETS, generateUniqueFileName, getPublicUrl } from "@/lib/minio"

const BUCKET_NAME = S3_BUCKETS.ABF_TI
const BANNERS_PREFIX = "banners/"

/**
 * Faz upload da imagem para o bucket do MinIO
 */
export async function uploadBannerImage(formData: FormData) {
  const { user } = await getAuthOrRedirect()

  try {
    // Verificar se o usuário é admin
    const isAdmin = user.roles.some(role => role.name === "admin")
    if (!isAdmin) {
      return {
        success: false,
        error: "Você não tem permissão para fazer upload de imagens"
      }
    }

    // Obter o arquivo da FormData
    const file = formData.get("file") as File
    if (!file) {
      return {
        success: false,
        error: "Nenhum arquivo enviado"
      }
    }

    // Gerar nome único para o arquivo
    const fileName = generateUniqueFileName(file.name)
    const filePath = `${BANNERS_PREFIX}${fileName}`

    // Ler o arquivo como buffer
    const buffer = await file.arrayBuffer()

    // Enviar o arquivo para o MinIO usando a função existente
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
    const publicUrl = getPublicUrl(BUCKET_NAME, filePath)

    await logInfo("Banner.uploadImage", `Imagem de banner enviada com sucesso: ${filePath}`, user.id, {
      filePath,
      fileName,
      fileSize: file.size,
      fileType: file.type
    })

    return {
      success: true,
      filePath,
      fileUrl: publicUrl
    }

  } catch (error) {
    await logError("Banner.uploadImage", `Erro ao fazer upload de imagem de banner`, user.id, {
      error: String(error)
    })

    console.error("Erro ao fazer upload de imagem:", error)

    return {
      success: false,
      error: "Ocorreu um erro ao fazer upload da imagem"
    }
  }
}