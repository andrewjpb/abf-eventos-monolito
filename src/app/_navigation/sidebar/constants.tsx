import {
  adminDashboardPath,
  bannersPath,
  bannerCreatePath,
  companiesPath,
  companyCreatePath,
  eventsAdminPath,
  eventCreatePath,
  externalEventsPath,
  externalEventCreatePath,
  highlightCardsPath,
  highlightCardCreatePath,
  logsPath,
  speakersPath,
  speakerCreatePath,
  sponsorsPath,
  sponsorCreatePath,
  supportersPath,
  supporterCreatePath,
  usersPath,
  userCreatePath,
  permissionsPath,
  permissionCreatePath,
  rolesPath,
  roleCreatePath
} from "@/app/paths"
import { NavItem } from "./types"
import {
  Home,
  Users,
  Key,
  Briefcase,
  Settings,
  Handshake,
  Calendar,
  UserCheck,
  Layout,
  ExternalLink,
  Image,
  FileText,
  Building,
  Shield
} from "lucide-react";

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: <Home />,
    href: adminDashboardPath(),
    role: "admin"
  },
  {
    title: "Usuários",
    icon: <Users />,
    href: usersPath(),
    role: "admin",
    subItems: [
      {
        title: "Lista de Usuários",
        href: usersPath(),
        role: "admin"
      },
      {
        title: "Novo Usuário",
        href: userCreatePath(),
        role: "admin"
      }
    ]
  },
  {
    title: "Empresas",
    icon: <Building />,
    href: companiesPath(),
    role: "admin",
    subItems: [
      {
        title: "Lista de Empresas",
        href: companiesPath(),
        role: "admin"
      },
      {
        title: "Nova Empresa",
        href: companyCreatePath(),
        role: "admin"
      }
    ]
  },
  {
    title: "Eventos",
    icon: <Calendar />,
    href: eventsAdminPath(),
    role: "admin",
    subItems: [
      {
        title: "Lista de Eventos",
        href: eventsAdminPath(),
        role: "admin"
      },
      {
        title: "Novo Evento",
        href: eventCreatePath(),
        role: "admin"
      }
    ]
  },
  {
    title: "Eventos Externos",
    icon: <ExternalLink />,
    href: externalEventsPath(),
    role: "admin",
    subItems: [
      {
        title: "Lista de Eventos Externos",
        href: externalEventsPath(),
        role: "admin"
      },
      {
        title: "Novo Evento Externo",
        href: externalEventCreatePath(),
        role: "admin"
      }
    ]
  },
  {
    title: "Palestrantes",
    icon: <UserCheck />,
    href: speakersPath(),
    role: "admin",
    subItems: [
      {
        title: "Lista de Palestrantes",
        href: speakersPath(),
        role: "admin"
      },
      {
        title: "Novo Palestrante",
        href: speakerCreatePath(),
        role: "admin"
      }
    ]
  },
  {
    title: "Patrocinadores",
    icon: <Briefcase />,
    href: sponsorsPath(),
    role: "admin",
    subItems: [
      {
        title: "Lista de Patrocinadores",
        href: sponsorsPath(),
        role: "admin"
      },
      {
        title: "Novo Patrocinador",
        href: sponsorCreatePath(),
        role: "admin"
      }
    ]
  },
  {
    title: "Apoiadores",
    icon: <Handshake />,
    href: supportersPath(),
    role: "admin",
    subItems: [
      {
        title: "Lista de Apoiadores",
        href: supportersPath(),
        role: "admin"
      },
      {
        title: "Novo Apoiador",
        href: supporterCreatePath(),
        role: "admin"
      }
    ]
  },
  {
    title: "Banners",
    icon: <Image />,
    href: bannersPath(),
    role: "admin",
    subItems: [
      {
        title: "Lista de Banners",
        href: bannersPath(),
        role: "admin"
      },
      {
        title: "Novo Banner",
        href: bannerCreatePath(),
        role: "admin"
      }
    ]
  },

  {
    title: "Logs do Sistema",
    icon: <FileText />,
    href: logsPath(),
    role: "admin"
  },
  {
    title: "Grupos de Usuários",
    icon: <Shield />,
    href: rolesPath(),
    role: "admin",
    subItems: [
      {
        title: "Lista de Grupos",
        href: rolesPath(),
        role: "admin"
      },
      {
        title: "Novo Grupo",
        href: roleCreatePath(),
        role: "admin"
      }
    ]
  },
  {
    title: "Permissões",
    icon: <Key />,
    href: permissionsPath(),
    role: "admin",
    subItems: [
      {
        title: "Lista de Permissões",
        href: permissionsPath(),
        role: "admin"
      },
      {
        title: "Nova Permissão",
        href: permissionCreatePath(),
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