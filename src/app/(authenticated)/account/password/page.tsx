import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { PasswordChangeView } from "@/features/account/components/password-change-view"

export default async function PasswordPage() {
  const { user } = await getAuthOrRedirect()
  
  return (
    <PasswordChangeView user={user} />
  )
}