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

export async function AppSidebar() {
  const auth = await getAuth();
  const user = await auth.user;

  const isAdmin = user?.roles.includes('admin') || false;

  // Obter o caminho atual da URL
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  if (!isAdmin) {
    return null;
  }

  const filteredNavItems = navItems.filter(item => {
    if (item.role === "admin" && !isAdmin) {
      return false;
    }
    return true;
  }).map(item => {
    if (item.subItems && item.subItems.length > 0) {
      return {
        ...item,
        subItems: item.subItems.filter(subItem =>
          !(subItem.role === "admin" && !isAdmin)
        )
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
      "hidden": !isAdmin,
    })}>
      <SidebarHeader />
      <SidebarContent className="pt-16 ">
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? "Administration" : "Application"}</SidebarGroupLabel>
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
                            {item.icon && cloneElement(item.icon, { className: "w-5 h-5 mr-2" })}
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
                      {item.icon && cloneElement(item.icon, { className: "w-5 h-5 mr-2" })}
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
    </Sidebar>
  );
}