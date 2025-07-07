import { CardCompact } from "@/components/cardCompact";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { signInPath } from "../paths";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function SignUpPage() {
  return <div className="flex-1 flex flex-col justify-center items-center p-4">
    <div className="w-full max-w-4xl animate-fade-in-from-top">
      <SignUpForm />
      <div className="text-center mt-6">
        <Link href={signInPath()} className={buttonVariants({ variant: "link" })}>
          Já tem uma conta? Fazer login
        </Link>
      </div>
    </div>
  </div>

}
