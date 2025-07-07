"use client"

import { User } from "lucia"
import { useState } from "react"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, Key, Shield, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form } from "@/components/form/form"
import { FieldError } from "@/components/form/field-error"
import { SubmitButton } from "@/components/form/submit-button"
import { useActionState } from "react"
import { changePassword } from "../actions/change-password"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { cn } from "@/lib/utils"

type PasswordChangeViewProps = {
  user: User
}

export function PasswordChangeView({ user }: PasswordChangeViewProps) {
  const [actionState, action] = useActionState(changePassword, EMPTY_ACTION_STATE)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative h-32 md:h-40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Conteúdo Principal */}
      <div className="container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <motion.div 
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="space-y-6"
        >
          {/* Header */}
          <Card className="overflow-hidden border-0 shadow-xl bg-card/95 backdrop-blur">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Alterar Senha</h1>
                  <p className="text-muted-foreground">Mantenha sua conta segura alterando sua senha regularmente</p>
                </div>
              </div>

              {/* Informações de Segurança */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Dicas de segurança:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Use pelo menos 6 caracteres</li>
                      <li>• Combine letras, números e símbolos</li>
                      <li>• Evite informações pessoais óbvias</li>
                      <li>• Não reutilize senhas de outras contas</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Formulário */}
              <Form action={action} actionState={actionState}>
                <div className="space-y-6">
                  {/* Senha Atual */}
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Senha Atual</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="current_password"
                        name="current_password"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Digite sua senha atual"
                        className="pl-10 pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FieldError actionState={actionState} name="current_password" />
                  </div>

                  {/* Nova Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="new_password">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new_password"
                        name="new_password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Digite sua nova senha"
                        className="pl-10 pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FieldError actionState={actionState} name="new_password" />
                  </div>

                  {/* Confirmar Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm_password"
                        name="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua nova senha"
                        className="pl-10 pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FieldError actionState={actionState} name="confirm_password" />
                  </div>

                  {/* Botão de Submit */}
                  <div className="pt-4">
                    <SubmitButton
                      label="Alterar Senha"
                      icon={<Save className="h-4 w-4" />}
                      className="w-full"
                      size="lg"
                    />
                  </div>
                </div>
              </Form>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}