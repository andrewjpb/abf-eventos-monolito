// /features/banners/actions/upsert-banner.ts
"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import { getAdminOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { revalidatePath } from "next/cache"
import { logError, logInfo } from "@/features/logs/queries/add-log"

// Schema para validação
const bannerSchema = z.object({
  title: z.string().min(1, { message: "Título do banner é obrigatório" }),
  image_url: z.string().min(1, { message: "URL da imagem é obrigatória" }),
  external_link: z.string().min(1, { message: "Link externo é obrigatório" }),
  active: z.coerce.boolean().default(true),
});

export const upsertBanner = async (
  bannerId: string | undefined,
  _actionState: ActionState,
  formData: FormData
) => {
  const { user } = await getAdminOrRedirect()

  try {
    const data = bannerSchema.parse(Object.fromEntries(formData))

    // Se é uma atualização, verificar se o banner existe
    if (bannerId) {
      const existingBanner = await prisma.highlight_card.findUnique({
        where: { id: bannerId },
        select: {
          id: true,
          title: true,
        }
      })

      if (!existingBanner) {
        await logInfo("Banner.update", `Tentativa de atualizar banner inexistente #${bannerId}`, user.id, {
          bannerId
        })
        return toActionState("ERROR", "Banner não encontrado")
      }

      // Atualizar o banner existente
      await prisma.highlight_card.update({
        where: { id: bannerId },
        data: {
          title: data.title,
          image_url: data.image_url,
          external_link: data.external_link,
          active: data.active,
          updatedAt: new Date()
        }
      })

      await logInfo("Banner.update", `Banner #${bannerId} atualizado: ${data.title}`, user.id, {
        bannerId,
        bannerTitle: data.title
      })

    } else {
      // Criar novo banner
      const newBannerId = nanoid()

      await prisma.highlight_card.create({
        data: {
          id: newBannerId,
          title: data.title,
          image_url: data.image_url,
          external_link: data.external_link,
          active: data.active,
          created_at: new Date(),
          updatedAt: new Date()
        }
      })

      await logInfo("Banner.create", `Novo banner criado: ${data.title}`, user.id, {
        bannerId: newBannerId,
        bannerTitle: data.title
      })

      // Atualizar ID para redirecionamento
      bannerId = newBannerId
    }

    // Revalidar caminhos para atualizar os banners exibidos
    revalidatePath('/')
    revalidatePath('/banners')

    return toActionState("SUCCESS", `Banner ${bannerId ? 'atualizado' : 'criado'} com sucesso`)

  } catch (error) {
    await logError("Banner.upsert", `Erro ao ${bannerId ? 'atualizar' : 'criar'} banner`, user.id, {
      bannerId,
      error: String(error),
      formDataKeys: Array.from(formData.keys())
    })
    return fromErrorToActionState(error, formData)
  }
}