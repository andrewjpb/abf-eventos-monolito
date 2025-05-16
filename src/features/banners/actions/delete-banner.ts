// /features/banners/actions/delete-banner.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { bannersPath } from "@/app/paths"
import { toActionState } from "@/components/form/utils/to-action-state"
import { redirect } from "next/navigation"
import { logError, logInfo, logWarn } from "@/features/logs/queries/add-log"
import { getAuthWithPermission } from "@/features/auth/queries/get-auth-with-permission"

export const deleteBanner = async (id: string) => {
  const { user, error } = await getAuthWithPermission("banners.delete")
  // Se houver erro de permissão, retornar o erro
  if (error) {
    return toActionState("ERROR", "Você não tem permissão para realizar esta ação")
  }

  try {
    // Verificar se o banner existe
    const banner = await prisma.highlight_card.findUnique({
      where: { id }
    })

    // Se não existe ou o usuário não tem permissão
    if (!banner) {
      await logWarn("Banner.delete", `Tentativa de excluir banner inexistente #${id}`, user.id, {
        bannerId: id
      })
      return toActionState("ERROR", "Banner não encontrado")
    }

    // Verificar se o usuário é admin
    const isAdmin = user.roles.some(role => role.name === "admin")
    if (!isAdmin) {
      await logWarn("Banner.delete", `Acesso negado: usuário não-admin tentou excluir banner`, user.id, {
        bannerId: id,
        bannerTitle: banner.title,
        isAdmin
      })
      return toActionState("ERROR", "Você não tem permissão para excluir este banner")
    }

    // Excluir o banner
    await prisma.highlight_card.delete({
      where: { id }
    })

    await logInfo("Banner.delete", `Banner #${id} (${banner.title}) excluído com sucesso`, user.id, {
      bannerId: id,
      bannerTitle: banner.title
    })

    revalidatePath(bannersPath())
    revalidatePath('/')

    return redirect(bannersPath())
  } catch (error) {
    await logError("Banner.delete", `Erro ao excluir banner #${id}`, user.id, {
      bannerId: id,
      error: String(error)
    })
    console.error("Erro ao excluir banner:", error)
    return toActionState("ERROR", "Ocorreu um erro ao excluir o banner")
  }
}