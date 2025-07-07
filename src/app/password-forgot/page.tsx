import { Metadata } from "next"
import { PasswordForgotForm } from "@/features/auth/components/password-forgot-form"

export const metadata: Metadata = {
  title: "Esqueci minha senha - ABF Eventos",
  description: "Solicite um link para redefinir sua senha"
}

export default function PasswordForgotPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <PasswordForgotForm />
    </div>
  )
}