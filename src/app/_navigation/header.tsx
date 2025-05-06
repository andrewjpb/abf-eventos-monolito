"use client"


import { homePath, signInPath } from "@/app/paths";
import Link from "next/link";
import { buttonVariants } from "../../components/ui/button";
import { ThemeSwitcher } from "../../components/theme/theme-swicher";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AccountDropdown } from "./account-dropdown";
import Image from "next/image";
import { Mail } from "lucide-react";

export function Header() {
  const { isFetched, user } = useAuth()

  if (!isFetched) return null

  const navItems = user ? (<>
    <AccountDropdown user={user} />
  </>) : <>
    <Link href={signInPath()} className={buttonVariants({ variant: "outline" })}>Acessar</Link>
  </>

  return (
    <nav className="
    animate-header-from-top
    supports-backdrop-blur:bg-background
    fixed left-0 right-0 top-0 z-20
    border-b bg-background backdrop-blur
    w-full flex py-2.5 px-5 justify-between h-20
    items-center
    ">
      <div>
        <Link href={homePath()} className="filter dark:contrast-0" >
          <Image src="/logo-blue.webp" alt="logo" width={210} height={30} className="filter"
          />
        </Link>
      </div>
      <div className="flex items-center gap-x-4">
        <Link href={homePath()} className="filter dark:contrast-0 flex items-center gap-x-2" >
          <Mail className="w-4 h-4 " />
          <p className="text-muted-foreground">
            eventos@abf.com.br
          </p>
        </Link>
        <Link href={homePath()} className={buttonVariants({ variant: "default" })}>
          <p>Associe-se</p>
        </Link>
        <ThemeSwitcher />
        {navItems}
      </div>
    </nav>
  )
}
