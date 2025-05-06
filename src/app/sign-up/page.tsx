import { CardCompact } from "@/components/cardCompact";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { signInPath } from "../paths";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function SignUpPage() {
  return <div className="flex-1 flex flex-col justify-center items-center">
    <CardCompact
      title="Sign Up"
      description="Create an account to get started"
      className="w-full max-w-[420px] animate-fade-in-from-top"
      content={<SignUpForm />}
      footer={
        <Link href={signInPath()} className={buttonVariants({ variant: "link" })}>
          Already have an account? Sign in
        </Link>
      }
    />
  </div>

}
