import { homePath, signInPath, signUpPath, passwordForgotPath } from "@/app/paths"
import { NavItem } from "./types"
import { Home, LogIn } from "lucide-react";

export const navItems: NavItem[] = [
  {
    title: "Home",
    icon: <Home />,
    href: homePath(),
    subItems: [
      {
        title: "Página Inicial",
        href: homePath(),
      }
    ]
  },
  {
    title: "Login",
    icon: <LogIn />,
    href: signInPath(),
    subItems: [
      {
        title: "Entrar",
        href: signInPath(),
      },
      {
        title: "Cadastrar",
        href: signUpPath(),
      },
      {
        title: "Esqueci a senha",
        href: passwordForgotPath(),
      }
    ]
  }
]