import { ThemeProvider as BaseThemeProvider } from "next-themes"
import { SidebarProvider } from "../ui/sidebar"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </BaseThemeProvider>
  )
}

