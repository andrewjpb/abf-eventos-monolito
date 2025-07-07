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
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { LucideLock, LucideLogOut, LucideUser } from "lucide-react"
import { SignOut } from "@/features/auth/actions/sign-out"
import Link from "next/link"
import { accountPasswordPath, accountProfilePath } from "@/app/paths"
import { Form } from "@/components/form/form"
import { useActionState } from "react"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { SubmitButton } from "@/components/form/submit-button"

type AccountDropdownProps = {
  user: AuthUser & {
    image_url?: string;
    thumb_url?: string;
  }
}

const AccountDropdown = ({ user }: AccountDropdownProps) => {


  const [actionState, action] = useActionState(SignOut, EMPTY_ACTION_STATE)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="w-9 h-9 cursor-pointer border-2 border-primary/20">
          <AvatarImage src={user?.thumb_url || user?.image_url} alt={user?.username} />
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
        <DropdownMenuItem className="p-0">
          <Link href={accountProfilePath()} className="flex items-center gap-2 w-full px-2 py-1.5">
            <LucideUser className="w-4 h-4" />
            <span>Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <Link href={accountPasswordPath()} className="flex items-center gap-2 w-full px-2 py-1.5">
            <LucideLock className="w-4 h-4" />
            <span>Senha</span>
          </Link>
        </DropdownMenuItem>

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
