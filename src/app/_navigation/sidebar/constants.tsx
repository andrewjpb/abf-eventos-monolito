import { homePath, signInPath } from "@/app/paths"
import { NavItem } from "./types"
import {
  Home,
  Users,
  Key,
  Briefcase,
  Settings,
  Handshake
} from "lucide-react";

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: <Home />,
    href: homePath(),
    role: "admin"
  },
  {
    title: "Usuários",
    icon: <Users />,
    href: "/admin/users",
    role: "admin",
    subItems: [
      {
        title: "Lista de Usuários",
        href: "/admin/users",
        role: "admin"
      },
      {
        title: "Novo Usuário",
        href: "/admin/users/new",
        role: "admin"
      }
    ]
  },
  {
    title: "Permissões",
    icon: <Key />,
    href: "/admin/permissions",
    role: "admin",
    subItems: [
      {
        title: "Perfis de Acesso",
        href: "/admin/roles",
        role: "admin"
      },
      {
        title: "Permissões",
        href: "/admin/permissions",
        role: "admin"
      }
    ]
  },
  {
    title: "Patrocinadores",
    icon: <Briefcase />,
    href: "/admin/sponsors",
    role: "admin",
    subItems: [
      {
        title: "Lista de Patrocinadores",
        href: "/admin/sponsors",
        role: "admin"
      },
      {
        title: "Novo Patrocinador",
        href: "/admin/sponsors/new",
        role: "admin"
      }
    ]
  },
  {
    title: "Apoiadores",
    icon: <Handshake />,
    href: "/admin/supporters",
    role: "admin",
    subItems: [
      {
        title: "Lista de Apoiadores",
        href: "/admin/supporters",
        role: "admin"
      },
      {
        title: "Novo Apoiador",
        href: "/admin/supporters/new",
        role: "admin"
      }
    ]
  },
  {
    title: "Configurações",
    icon: <Settings />,
    href: "/admin/settings",
    role: "admin"
  }
]