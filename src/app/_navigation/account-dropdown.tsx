"use client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User as AuthUser } from "lucia"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { LucideLock, LucideLogOut, LucideShield, LucideUser } from "lucide-react"
import { SignOut } from "@/features/auth/actions/sign-out"
import Link from "next/link"
import { accountPasswordPath, accountProfilePath } from "@/app/paths"
import { Form } from "@/components/form/form"
import { useActionState } from "react"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { SubmitButton } from "@/components/form/submit-button"

type AccountDropdownProps = {
  user: AuthUser
}

const AccountDropdown = ({ user }: AccountDropdownProps) => {
  const isAdmin = user?.isAdmin || false;
  const [actionState, action] = useActionState(SignOut, EMPTY_ACTION_STATE)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="w-9 h-9 cursor-pointer">
          <AvatarFallback className="text-lg">
            {user?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          <span className="text-sm font-medium flex gap-1">Olá	,<strong className="capitalize">{user.username}</strong></span>

        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href={accountProfilePath()} className="flex items-center gap-2">
            <LucideUser className="w-4 h-4" />
            <span>Perfil</span>
          </Link>

        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={accountPasswordPath()} className="flex items-center gap-2">
            <LucideLock className="w-4 h-4" />
            <span>Senha</span>
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem>
            <Link href="/admin" className="flex items-center gap-2">
              <LucideShield className="w-4 h-4" />
              <span>Administrativo</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex flex-col w-full">
          <div className="w-full border rounded-md">
            <Form action={action}
              actionState={actionState}
            >
              <SubmitButton label="Sair" icon={<LucideLogOut className="w-4 h-4" />} variant="ghost" size="lg" />

            </Form>
          </div>

        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { AccountDropdown }
