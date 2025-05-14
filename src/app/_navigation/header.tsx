"use client"

import { homePath, signInPath, adminDashboardPath } from "@/app/paths";
import Link from "next/link";
import { buttonVariants } from "../../components/ui/button";
import { ThemeSwitcher } from "../../components/theme/theme-swicher";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AccountDropdown } from "./account-dropdown";
import Image from "next/image";
import { Mail, Menu, X, Layout } from "lucide-react";
import { useState } from "react";
import { useCheckPermission } from "@/features/permissions/hooks/use-check-permission";

export function Header() {
  const { isFetched, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Verificar se o usuário tem permissão para acessar o painel
  const { hasPermission: canAccessPanel } = useCheckPermission(
    user?.id,
    "panel.access"
  );

  if (!isFetched) return null;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Criando duas versões de navItems - uma para desktop e outra para mobile
  const desktopNavItems = user ? (
    <>
      {/* Botão de painel admin (mostrado apenas se o usuário tem permissão) */}
      {canAccessPanel && (
        <Link href={adminDashboardPath()} className={buttonVariants({ variant: "outline", className: "mr-2" })}>
          <Layout className="mr-2 h-4 w-4" />
          Painel Admin
        </Link>
      )}

      <AccountDropdown user={user} />
    </>
  ) : (
    <Link href={signInPath()} className={buttonVariants({ variant: "outline" })}>
      Acessar
    </Link>
  );

  // Versão mobile com melhor UX/UI para a foto do usuário
  const mobileNavItems = user ? (
    <div className="flex flex-col w-full gap-y-4">
      <div className="flex items-center justify-between w-full py-2">
        <div className="flex items-center gap-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
            {user?.picture ? (
              <Image
                src={user.picture}
                alt={user.username || "Usuário"}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-lg font-medium">
                {user.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium">{user.username || "Usuário"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <button
          className={buttonVariants({
            variant: "ghost",
            className: "text-destructive hover:text-destructive hover:bg-destructive/10"
          })}
          onClick={() => {
            // Função para sair - você pode adicionar a lógica aqui
            setMobileMenuOpen(false);
          }}
        >
          Sair
        </button>
      </div>

      {/* Botão do painel para mobile (mostrado apenas se o usuário tem permissão) */}
      {user && canAccessPanel && (
        <Link
          href={adminDashboardPath()}
          className={buttonVariants({
            variant: "outline",
            className: "w-full justify-center"
          })}
          onClick={() => setMobileMenuOpen(false)}
        >
          <Layout className="mr-2 h-4 w-4" />
          Acessar Painel Administrativo
        </Link>
      )}
    </div>
  ) : (
    <Link
      href={signInPath()}
      className={buttonVariants({ variant: "default", className: "w-full justify-center" })}
      onClick={() => setMobileMenuOpen(false)}
    >
      Acessar
    </Link>
  );

  return (
    <nav className="
      animate-header-from-top
      supports-backdrop-blur:bg-background
      fixed left-0 right-0 top-0 z-20
      bg-background backdrop-blur
      flex py-2.5 justify-between h-16 md:h-20
      border-b border-border
    ">
      <div className="container flex-1 flex justify-between w-full mx-auto px-4 md:px-6">
        <div className="flex items-center">
          <Link href={homePath()} className="filter dark:contrast-0">
            <Image
              src="/logo-blue.webp"
              alt="logo"
              width={150}
              height={25}
              className="filter w-32 md:w-52"
            />
          </Link>
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-x-4">
          <Link href={homePath()} className="filter dark:contrast-0 flex items-center gap-x-2">
            <Mail className="w-4 h-4" />
            <p className="text-muted-foreground">
              eventos@abf.com.br
            </p>
          </Link>
          <Link href={homePath()} className={buttonVariants({ variant: "default" })}>
            <p>Associe-se</p>
          </Link>
          <ThemeSwitcher />
          {desktopNavItems}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center md:hidden">
          <ThemeSwitcher />
          <button
            onClick={toggleMobileMenu}
            className="ml-2 p-2 rounded-md hover:bg-accent"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border z-30 shadow-lg">
          <div className="container mx-auto px-4 pb-4 flex flex-col gap-y-4">
            <div className="py-3 border-b border-border mb-2">
              {mobileNavItems}
            </div>

            <Link
              href={homePath()}
              className={buttonVariants({ variant: "default", className: "w-full justify-center" })}
              onClick={() => setMobileMenuOpen(false)}
            >
              <p>Associe-se</p>
            </Link>

          </div>
        </div>
      )}
    </nav>
  );
}