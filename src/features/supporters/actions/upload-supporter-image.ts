// /features/supporters/actions/upload-supporter-image.ts
"use server"

import { logError, logInfo } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { toActionState } from "@/components/form/utils/to-action-state"
import { minioClient, S3_BUCKETS, generateUniqueFileName, getPublicUrl } from "@/lib/minio"

const BUCKET_NAME = S3_BUCKETS.ABF_TI
const SUPPORTERS_PREFIX = "supporters/"

/**
 * Faz upload da imagem para o bucket do MinIO
 */
export async function uploadSupporterImage(formData: FormData) {
  const { user, error } = await getAuthWithPermission("supporters.update")
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

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
    const filePath = `${SUPPORTERS_PREFIX}${fileName}`

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

    await logInfo("Supporter.uploadImage", `Imagem de apoiador enviada com sucesso: ${filePath}`, user.id, {
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
    await logError("Supporter.uploadImage", `Erro ao fazer upload de imagem de apoiador`, user.id, {
      error: String(error)
    })

    console.error("Erro ao fazer upload de imagem:", error)

    return {
      success: false,
      error: "Ocorreu um erro ao fazer upload da imagem"
    }
  }
}