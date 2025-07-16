"use client"

import { FieldError } from "@/components/form/field-error"
import { Form } from "@/components/form/form"
import { SubmitButton } from "@/components/form/submit-button"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { Input } from "@/components/ui/input"
import { useActionState } from "react"
import { signIn } from "../actions/sign-in"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { passwordForgotPath } from "@/app/paths"

const SignInForm = () => {

  const [actionState, action] = useActionState(signIn, EMPTY_ACTION_STATE)
  return <Form
    action={action}
    actionState={actionState}
  >
    <Label>Email</Label>
    <Input 
      name="email" 
      placeholder="Digite seu email"
      defaultValue={actionState.payload?.get("email") as string}
    />
    <FieldError actionState={actionState} name="email" />


    <Label>Senha</Label>
    <Input name="password" placeholder="Digite sua senha" type="password" />
    <FieldError actionState={actionState} name="password" />
    
    <div className="flex justify-end">
      <Button variant="link" size="sm" asChild className="px-0 h-auto">
        <Link href={passwordForgotPath()}>
          Esqueci minha senha
        </Link>
      </Button>
    </div>
    
    <SubmitButton label="Entrar" />

  </Form>

}


export { SignInForm }
