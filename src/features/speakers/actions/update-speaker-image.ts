// /features/speakers/actions/update-speaker-image.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"
import { revalidatePath } from "next/cache"
import { speakerPath, speakersPath } from "@/app/paths"
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
const SPEAKERS_PREFIX = "speakers/"

// Schema para validação da imagem
const imageSchema = z.object({
  image_file: z.any()
    .refine(file => file !== null && file !== undefined, {
      message: "É necessário fornecer uma imagem para o usuário"
    })
});

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
  // Para arquivos do tipo File/Blob do navegador
  if (file instanceof Blob || (typeof file === 'object' && file !== null && 'arrayBuffer' in file && typeof file.arrayBuffer === 'function')) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return {
      buffer,
      type: file.type || 'image/jpeg',
      size: buffer.length,
      name: file.name || 'image.jpg'
    };
  }

  // Para buffers
  if (Buffer.isBuffer(file)) {
    return {
      buffer: file,
      type: 'application/octet-stream',
      size: file.length,
      name: 'buffer.bin'
    };
  }

  // Para FormData entries ou objetos
  if (typeof file === 'object' && file !== null) {
    // Tentar extrair o arquivo real se for um FormData entry
    const actualFile = file.valueOf?.() ?? file;

    if (actualFile instanceof Blob || 'arrayBuffer' in actualFile) {
      return getFileBuffer(actualFile);
    }

    // Se tem um stream()
    if (typeof file.stream === 'function') {
      const chunks = [];
      for await (const chunk of file.stream()) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      return {
        buffer,
        type: file.type || 'application/octet-stream',
        size: buffer.length,
        name: file.name || 'streamed-file.bin'
      };
    }

    // Se tem dados em buffer
    if (file.data && Buffer.isBuffer(file.data)) {
      return {
        buffer: file.data,
        type: file.type || 'application/octet-stream',
        size: file.data.length,
        name: file.name || 'data-file.bin'
      };
    }
  }

  // Falha segura - converter para string como último recurso
  const stringData = String(file);
  const buffer = Buffer.from(stringData);
  return {
    buffer,
    type: 'text/plain',
    size: buffer.length,
    name: 'text-file.txt'
  };
}

export const updateSpeakerImage = async (
  speakerId: string,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user, error } = await getAuthWithPermission("speakers.update");
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação");
  }

  // Verificar se o usuário é admin
  const isAdmin = user.roles.some(role => role.name === "admin");
  if (!isAdmin) {
    await logWarn("Speaker.updateImage", `Acesso negado: usuário não-admin tentou atualizar imagem do palestrante`, user.id, {
      speakerId,
      isAdmin
    });
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação");
  }

  try {
    // Buscar o palestrante para obter o ID do usuário
    const speaker = await prisma.speakers.findUnique({
      where: { id: speakerId },
      include: {
        users: {
          select: { id: true, name: true, image_url: true }
        }
      }
    });

    if (!speaker) {
      await logWarn("Speaker.updateImage", `Tentativa de atualizar imagem de palestrante inexistente #${speakerId}`, user.id, {
        speakerId
      });
      return toActionState("ERROR", "Palestrante não encontrado");
    }

    // Obter o FormData como objeto e validar
    const formDataObject = Object.fromEntries(formData.entries());

    try {
      // Validar dados com Zod
      imageSchema.parse(formDataObject);
    } catch (validationError) {
      return fromErrorToActionState(validationError, formData);
    }

    // Extrair o arquivo de imagem do FormData
    const fileData = formData.get("image_file");

    if (!fileData) {
      return toActionState("ERROR", "É necessário fornecer uma imagem para o usuário");
    }

    // Validar o tipo de arquivo (opcional - você pode inserir isso também)
    if (fileData instanceof File) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(fileData.type)) {
        return toActionState("ERROR", "Formato de arquivo inválido. Apenas JPG, PNG, GIF e WE BP são aceitos.");
      }

      if (fileData.size > 5 * 1024 * 1024) { // 5MB
        return toActionState("ERROR", "Arquivo muito grande. O tamanho máximo permitido é 5MB.");
      }
    }

    // Extrair informações do arquivo usando a função melhorada
    const { buffer, type, size, name } = await getFileBuffer(fileData);

    // Gerar nome único para o arquivo
    const fileName = generateUniqueFileName(name);
    const filePath = `${SPEAKERS_PREFIX}${speaker.users.id}/${fileName}`;

    // Verificar se o diretório do usuário existe no bucket
    try {
      // Para MinIO, apenas prosseguimos com o upload
      console.log(`Enviando arquivo para ${BUCKET_NAME}/${filePath}`);

      // Importante: Enviar o buffer como stream para garantir integridade
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      // Enviar o arquivo para o MinIO como stream
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

      // Atualizar o URL da imagem no usuário
      await prisma.users.update({
        where: { id: speaker.users.id },
        data: {
          image_url: publicUrl,
          updatedAt: new Date()
        }
      });

      await logInfo("Speaker.updateImage", `Imagem do usuário #${speaker.users.id} atualizada`, user.id, {
        speakerId,
        userId: speaker.users.id,
        speakerName: speaker.users.name,
        oldImageUrl: speaker.users.image_url,
        newImageUrl: publicUrl,
        filePath,
        fileName,
        fileSize: size,
        fileType: type
      });

      // Revalidar as páginas necessárias
      revalidatePath(speakersPath());
      revalidatePath(speakerPath(speakerId));

      return toActionState("SUCCESS", "Imagem do usuário atualizada com sucesso");
    } catch (uploadError) {
      console.error("Erro ao fazer upload para o MinIO:", uploadError);
      await logError("Speaker.updateImage", `Erro no upload para MinIO #${speakerId}`, user.id, {
        speakerId,
        error: String(uploadError),
        buffer_length: buffer.length
      });
      return toActionState("ERROR", `Erro ao fazer upload da imagem: ${uploadError || uploadError}`);
    }
  } catch (error) {
    await logError("Speaker.updateImage", `Erro ao atualizar imagem do palestrante #${speakerId}`, user.id, {
      speakerId,
      error: String(error)
    });
    console.error("Erro ao atualizar imagem do palestrante:", error);
    return fromErrorToActionState(error, formData);
  }
};