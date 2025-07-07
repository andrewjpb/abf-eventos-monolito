"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Key, Eye, EyeOff, ArrowLeft, Shield, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form } from "@/components/form/form"
import { FieldError } from "@/components/form/field-error"
import { SubmitButton } from "@/components/form/submit-button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useActionState } from "react"
import { resetPassword } from "../actions/reset-password"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { signInPath } from "@/app/paths"

type PasswordResetFormProps = {
  token: string
}

export function PasswordResetForm({ token }: PasswordResetFormProps) {
  const [actionState, action] = useActionState(resetPassword, EMPTY_ACTION_STATE)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [otp, setOtp] = useState("")

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  if (actionState.status === "SUCCESS") {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeIn}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-fit">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Senha alterada!</CardTitle>
              <CardDescription>
                Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href={signInPath()}>
                Fazer login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="w-full max-w-md"
    >
      <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
            <CardDescription>
              Digite o código recebido por email e sua nova senha
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form action={action} actionState={actionState}>
            <input type="hidden" name="token" value={token} />
            <div className="space-y-6">
              {/* Código OTP */}
              <div className="space-y-2">
                <Label htmlFor="otp">Código de verificação</Label>
                <div className="flex justify-center">
                  <InputOTP 
                    maxLength={6} 
                    value={otp} 
                    onChange={setOtp}
                    name="otp"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Digite o código de 6 dígitos enviado para seu email
                </p>
                <FieldError actionState={actionState} name="otp" />
              </div>

              {/* Nova Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    className="pl-10 pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FieldError actionState={actionState} name="password" />
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar nova senha</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

              {/* Dicas de segurança */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium mb-1">Dicas de segurança:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Use pelo menos 6 caracteres</li>
                  <li>• Combine letras, números e símbolos</li>
                  <li>• Evite informações pessoais óbvias</li>
                </ul>
              </div>

              <div className="space-y-3">
                <SubmitButton
                  label="Redefinir senha"
                  icon={<Shield className="h-4 w-4" />}
                  className="w-full"
                  size="lg"
                />
                
                <Button variant="ghost" className="w-full" asChild>
                  <Link href={signInPath()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao login
                  </Link>
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  )
}