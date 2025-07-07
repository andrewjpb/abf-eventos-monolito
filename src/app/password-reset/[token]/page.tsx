import { Metadata } from "next"
import { PasswordResetForm } from "@/features/auth/components/password-reset-form"

export const metadata: Metadata = {
  title: "Redefinir senha - ABF Eventos",
  description: "Digite o código recebido por email para redefinir sua senha"
}

type PasswordResetPageProps = {
  params: Promise<{ token: string }>
}

export default async function PasswordResetPage({ params }: PasswordResetPageProps) {
  const { token } = await params
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <PasswordResetForm token={token} />
    </div>
  )
}