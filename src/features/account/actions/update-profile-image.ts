"use server"

import { ActionState, toActionState, fromErrorToActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { accountProfilePath } from "@/app/paths"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { logInfo, logError } from "@/features/logs/queries/add-log"
import { z } from "zod"
import * as Minio from 'minio'
import { nanoid } from "nanoid"

// Cliente MinIO
const minioClient = new Minio.Client({
  endPoint: '10.0.0.23',
  port: 9001,
  useSSL: false,
  accessKey: process.env.S3_ACCESS_KEY_ID,
  secretKey: process.env.S3_SECRET_ACCESS_KEY,
})

const BUCKET_NAME = "eventos"
const USERS_PREFIX = "users/"

// Schema para validação da imagem
const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB
const imageSchema = z.object({
  image_file: z.any()
    .refine(file => file !== null && file !== undefined, {
      message: "É necessário fornecer uma imagem"
    })
})

// Gera um nome de arquivo único para o upload
const generateUniqueFileName = (originalName: string = "image.jpg"): string => {
  const extension = originalName.split('.').pop() || 'jpg'
  const uniqueId = nanoid(10)
  return `${Date.now()}-${uniqueId}.${extension}`
}

// Função para obter o buffer do arquivo
async function getFileBuffer(file: any): Promise<{ buffer: Buffer, type: string, size: number, name: string }> {
  if (file instanceof Blob || (typeof file === 'object' && file !== null && 'arrayBuffer' in file && typeof file.arrayBuffer === 'function')) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return {
      buffer,
      type: file.type || 'image/jpeg',
      size: buffer.length,
      name: file.name || 'image.jpg'
    };
  }

  if (Buffer.isBuffer(file)) {
    return {
      buffer: file,
      type: 'application/octet-stream',
      size: file.length,
      name: 'buffer.bin'
    };
  }

  throw new Error("Formato de arquivo inválido");
}

export const updateProfileImage = async (
  _actionState: ActionState,
  formData: FormData
) => {
  try {
    const { user } = await getAuthOrRedirect()
    
    // Obter o FormData como objeto e validar
    const formDataObject = Object.fromEntries(formData.entries());
    
    try {
      imageSchema.parse(formDataObject);
    } catch (validationError) {
      return fromErrorToActionState(validationError, formData);
    }
    
    // Extrair o arquivo de imagem do FormData
    const fileData = formData.get("image_file");
    
    if (!fileData) {
      return toActionState("ERROR", "É necessário fornecer uma imagem");
    }
    
    // Validar o tipo de arquivo
    if (fileData instanceof File) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(fileData.type)) {
        return toActionState("ERROR", "Formato de arquivo inválido. Apenas JPG, PNG, GIF e WEBP são aceitos.");
      }
      
      if (fileData.size > MAX_FILE_SIZE) {
        return toActionState("ERROR", "Arquivo muito grande. O tamanho máximo permitido é 1MB.");
      }
    }
    
    // Extrair informações do arquivo
    const { buffer, type, size, name } = await getFileBuffer(fileData);
    
    // Gerar nome único para o arquivo
    const fileName = generateUniqueFileName(name);
    const filePath = `${USERS_PREFIX}${user.id}/${fileName}`;
    
    // Upload para MinIO
    try {
      console.log(`Enviando arquivo para ${BUCKET_NAME}/${filePath}`);
      
      // Enviar o arquivo para o MinIO como stream
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);
      
      await minioClient.putObject(
        BUCKET_NAME,
        filePath,
        bufferStream,
        size,
        {
          'Content-Type': type,
        }
      );
      
      // Aguardar um momento para garantir que o upload foi concluído
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // URL pública da imagem
      const publicUrl = `https://s3.abfti.com.br/${BUCKET_NAME}/${filePath}`;
      const thumbUrl = publicUrl; // Por enquanto usando a mesma URL
      
      // Atualizar o URL da imagem no usuário
      await prisma.users.update({
        where: { id: user.id },
        data: {
          image_url: publicUrl,
          thumb_url: thumbUrl,
          image_path: filePath,
          thumb_path: filePath,
          updatedAt: new Date()
        }
      });
      
      await logInfo("Profile.updateImage", `Usuário atualizou sua foto de perfil`, user.id, {
        oldImageUrl: user.image_url,
        newImageUrl: publicUrl,
        filePath,
        fileName,
        fileSize: size,
        fileType: type
      });
      
      revalidatePath(accountProfilePath());
      
      return toActionState("SUCCESS", "Foto de perfil atualizada com sucesso!");
      
    } catch (uploadError) {
      console.error("Erro ao fazer upload para o MinIO:", uploadError);
      await logError("Profile.updateImage", `Erro no upload para MinIO`, user.id, {
        error: String(uploadError),
        buffer_length: buffer.length
      });
      return toActionState("ERROR", `Erro ao fazer upload da imagem: ${uploadError}`);
    }
    
  } catch (error) {
    await logError("Profile.updateImage", `Erro ao atualizar foto de perfil: ${error}`, undefined, { error });
    return toActionState("ERROR", "Erro ao atualizar foto de perfil");
  }
}