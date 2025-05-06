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
import { LucideLock, LucideLogOut, LucideUser } from "lucide-react"
import { SignOut } from "@/features/auth/actions/sign-out"
import Link from "next/link"
import { accountPasswordPath, accountProfilePath } from "@/app/paths"

type AccountDropdownProps = {
  user: AuthUser
}

const AccountDropdown = ({ user }: AccountDropdownProps) => {



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
          <span className="text-sm font-medium flex gap-1">Hi,<strong className="capitalize">{user.username}</strong></span>

        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href={accountProfilePath()} className="flex items-center gap-2">
            <LucideUser className="w-4 h-4" />
            <span>Profile</span>
          </Link>

        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={accountPasswordPath()} className="flex items-center gap-2">
            <LucideLock className="w-4 h-4" />
            <span>Password</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <form action={SignOut} className="flex items-center gap-2 ">
            <LucideLogOut className="w-4 h-4" />
            <button type="submit">Sign Out</button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { AccountDropdown }
