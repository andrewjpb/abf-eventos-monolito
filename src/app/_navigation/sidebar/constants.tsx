import {
  adminDashboardPath,
  bannersPath,
  bannerCreatePath,
  companiesPath,
  companyCreatePath,
  eventsAdminPath,
  eventCreatePath,
  enrollmentsDashboardPath, // Nova rota para dashboard de inscrições
  enrollmentsListPath,      // Nova rota para lista de inscrições
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
import {
  Home,
  Users,
  Key,
  Briefcase,
  Settings,
  Handshake,
  Calendar,
  UserCheck,
  Image,
  FileText,
  Building,
  Shield,
  ClipboardList,
  BarChart3
} from "lucide-react";
import { ReactElement } from "react";

export interface NavItem {
  title: string
  href: string
  icon?: ReactElement
  role?: string  // Mantido para compatibilidade
  requiredPermission?: string  // Propriedade para verificação de permissão
  subItems?: {
    title: string
    href: string
    role?: string  // Mantido para compatibilidade
    requiredPermission?: string  // Propriedade para verificação de permissão
  }[]
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: <Home />,
    href: adminDashboardPath(),
    requiredPermission: "panel.access"  // Permissão geral para acesso ao painel
  },

  {
    title: "Inscrições",
    icon: <ClipboardList />,
    href: enrollmentsListPath(),
    requiredPermission: "enrollments.view",
    subItems: [
      {
        title: "Dashboard de Inscrições",
        href: enrollmentsDashboardPath(),
        requiredPermission: "enrollments.view"
      },
      {
        title: "Lista de Inscrições",
        href: enrollmentsListPath(),
        requiredPermission: "enrollments.view"
      }
    ]
  },

  {
    title: "Usuários",
    icon: <Users />,
    href: usersPath(),
    requiredPermission: "users.view",
    subItems: [
      {
        title: "Lista de Usuários",
        href: usersPath(),
        requiredPermission: "users.view"
      },
      {
        title: "Novo Usuário",
        href: userCreatePath(),
        requiredPermission: "users.create"
      }
    ]
  },
  {
    title: "Empresas",
    icon: <Building />,
    href: companiesPath(),
    requiredPermission: "companies.view",
    subItems: [
      {
        title: "Lista de Empresas",
        href: companiesPath(),
        requiredPermission: "companies.view"
      },
      {
        title: "Nova Empresa",
        href: companyCreatePath(),
        requiredPermission: "companies.create"
      }
    ]
  },
  {
    title: "Eventos",
    icon: <Calendar />,
    href: eventsAdminPath(),
    requiredPermission: "events.view",
    subItems: [
      {
        title: "Lista de Eventos",
        href: eventsAdminPath(),
        requiredPermission: "events.view"
      },
      {
        title: "Novo Evento",
        href: eventCreatePath(),
        requiredPermission: "events.create"
      }
    ]
  },

  {
    title: "Palestrantes",
    icon: <UserCheck />,
    href: speakersPath(),
    requiredPermission: "speakers.view",
    subItems: [
      {
        title: "Lista de Palestrantes",
        href: speakersPath(),
        requiredPermission: "speakers.view"
      },
      {
        title: "Novo Palestrante",
        href: speakerCreatePath(),
        requiredPermission: "speakers.create"
      }
    ]
  },
  {
    title: "Patrocinadores",
    icon: <Briefcase />,
    href: sponsorsPath(),
    requiredPermission: "sponsors.view",
    subItems: [
      {
        title: "Lista de Patrocinadores",
        href: sponsorsPath(),
        requiredPermission: "sponsors.view"
      },
      {
        title: "Novo Patrocinador",
        href: sponsorCreatePath(),
        requiredPermission: "sponsors.create"
      }
    ]
  },
  {
    title: "Apoiadores",
    icon: <Handshake />,
    href: supportersPath(),
    requiredPermission: "supporters.view",
    subItems: [
      {
        title: "Lista de Apoiadores",
        href: supportersPath(),
        requiredPermission: "supporters.view"
      },
      {
        title: "Novo Apoiador",
        href: supporterCreatePath(),
        requiredPermission: "supporters.create"
      }
    ]
  },
  {
    title: "Banners",
    icon: <Image />,
    href: bannersPath(),
    requiredPermission: "banners.view",
    subItems: [
      {
        title: "Lista de Banners",
        href: bannersPath(),
        requiredPermission: "banners.view"
      },
      {
        title: "Novo Banner",
        href: bannerCreatePath(),
        requiredPermission: "banners.create"
      }
    ]
  },
  {
    title: "Logs do Sistema",
    icon: <FileText />,
    href: logsPath(),
    requiredPermission: "logs.view"
  },
  {
    title: "Grupos de Usuários",
    icon: <Shield />,
    href: rolesPath(),
    requiredPermission: "roles.view",
    subItems: [
      {
        title: "Lista de Grupos",
        href: rolesPath(),
        requiredPermission: "roles.view"
      },
      {
        title: "Novo Grupo",
        href: roleCreatePath(),
        requiredPermission: "roles.create"
      }
    ]
  },
  {
    title: "Permissões",
    icon: <Key />,
    href: permissionsPath(),
    requiredPermission: "permissions.view",
    subItems: [
      {
        title: "Lista de Permissões",
        href: permissionsPath(),
        requiredPermission: "permissions.view"
      },
      {
        title: "Nova Permissão",
        href: permissionCreatePath(),
        requiredPermission: "permissions.create"
      }
    ]
  },
  {
    title: "Configurações",
    icon: <Settings />,
    href: "/admin/settings",
    requiredPermission: "settings.view"
  }
]