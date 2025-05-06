"use client"

import { CardCompact } from "@/components/cardCompact";
import { buttonVariants } from "@/components/ui/button";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import Link from "next/link";
import { signInPath } from "../paths";

export default function SignInPage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      <CardCompact
        title="Acesso sua conta"
        description="Faça login para continuar"
        className="w-full max-w-[420px] animate-fade-in-from-top"
        content={<SignInForm />}
        footer={
          <div className="flex flex-col justify-center items-center w-full" >
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?
            </p>
            <Link href={signInPath()} className={buttonVariants({ variant: "link" })}>
              Cadastre-se
            </Link>
          </div>
        }
      />
    </div>
  )
}
