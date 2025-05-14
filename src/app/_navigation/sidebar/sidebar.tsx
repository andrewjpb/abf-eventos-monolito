import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { navItems } from "./constants"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"
import { cloneElement } from "react"
import { getAuth } from "@/features/auth/queries/get-auth"
import { cn } from "@/lib/utils"
import { headers } from "next/headers"
import { getActivePath } from "@/utils/get-active-path"
import { prisma } from "@/lib/prisma"

// Lista de permissões que dão acesso ao painel administrativo
const PANEL_ACCESS_PERMISSIONS = [
  "panel.access",
  "users.view", "users.create",
  "companies.view", "companies.create",
  "events.view", "events.create", "events.update",
  "external_events.view", "external_events.create",
  "speakers.view", "speakers.create",
  "sponsors.view", "sponsors.create",
  "supporters.view", "supporters.create",
  "banners.view", "banners.create",
  "logs.view",
  "roles.view", "roles.create",
  "permissions.view", "permissions.create",
  "settings.view"
]

export async function AppSidebar() {
  const auth = await getAuth();
  const user = auth.user;

  // Obter o caminho atual da URL
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  // Se não houver usuário, não renderiza a sidebar
  if (!user) {
    return null;
  }

  // Verifica se é admin (acesso completo)
  const isAdmin = user.roles.some(role => role.name === "admin");

  // Se não for admin, verifica se tem alguma permissão de acesso ao painel
  let hasPanelAccess = isAdmin;
  let userPermissions: string[] = [];

  if (!isAdmin) {
    // Carrega o usuário com suas permissões
    const userWithPermissions = await prisma.users.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            permissions: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (userWithPermissions) {
      // Extrai todos os nomes de permissões do usuário
      userPermissions = userWithPermissions.roles.flatMap(role =>
        role.permissions.map(permission => permission.name)
      );

      // Verifica se tem alguma permissão de acesso ao painel
      hasPanelAccess = userPermissions.some(permission =>
        PANEL_ACCESS_PERMISSIONS.includes(permission)
      );
    }
  }

  // Se não tiver acesso ao painel, não renderiza a sidebar
  if (!hasPanelAccess) {
    return null;
  }

  // Filtra os itens de navegação baseado nas permissões
  const filteredNavItems = navItems.filter(item => {
    // Verifica por permissão específica primeiro
    if (item.requiredPermission) {
      // Admin sempre tem acesso
      if (isAdmin) return true;

      // Verifica se o usuário tem a permissão específica
      return userPermissions.includes(item.requiredPermission);
    }

    // Para retrocompatibilidade com o sistema baseado em roles
    if (item.role === "admin" && !isAdmin) {
      return false;
    }

    return true;
  }).map(item => {
    if (item.subItems && item.subItems.length > 0) {
      return {
        ...item,
        subItems: item.subItems.filter(subItem => {
          // Verifica permissão específica primeiro
          if (subItem.requiredPermission) {
            // Admin sempre tem acesso
            if (isAdmin) return true;

            // Verifica se o usuário tem a permissão específica
            return userPermissions.includes(subItem.requiredPermission);
          }

          // Para retrocompatibilidade
          return !(subItem.role === "admin" && !isAdmin);
        })
      };
    }
    return item;
  });

  // Coletar todos os caminhos para usar com getActivePath
  const allPaths = filteredNavItems.flatMap(item => {
    const paths = [item.href];
    if (item.subItems && item.subItems.length > 0) {
      paths.push(...item.subItems.map(subItem => subItem.href));
    }
    return paths;
  });

  // Determinar o caminho ativo
  const { active: activePath } = getActivePath(pathname, allPaths);

  return (
    <Sidebar className={cn("animate-sidebar-from-left", {
      "hidden": !hasPanelAccess,
    })}>
      <SidebarHeader />
      <SidebarContent className="pt-16 ">
        <SidebarGroup>
          <SidebarGroupLabel>Painel Administrativo</SidebarGroupLabel>
          <SidebarMenu>
            {filteredNavItems.map((item, index) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;

              // Verificar se este item ou algum de seus subitens é o caminho ativo
              const isItemActive = item.href === activePath;
              const isSubItemActive = item.subItems?.some(subItem => subItem.href === activePath) || false;

              // O menu deve estar aberto se um subitem está ativo
              const defaultOpen = isSubItemActive;

              if (hasSubItems) {
                return (
                  <Collapsible key={index} className="group/collapsible w-full" defaultOpen={defaultOpen}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full flex items-center justify-between">
                          <div className="flex items-center">
                            {item.icon && cloneElement(item.icon)}
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems?.map((subItem, subIndex) => {
                            const isActive = subItem.href === activePath;
                            return (
                              <SidebarMenuSubItem key={subIndex}>
                                <a
                                  href={subItem.href}
                                  className={cn("w-full block py-1.5 px-2 text-sm hover:bg-foreground/10 rounded-md", {
                                    "bg-foreground/10": isActive
                                  })}
                                >
                                  {subItem.title}
                                </a>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }

              return (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild
                    className={cn({
                      "bg-foreground/10": isItemActive && !hasSubItems
                    })}
                  >
                    <a href={item.href} className="flex items-center">
                      {item.icon && cloneElement(item.icon,)}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar >
  );
}