import { getAdminOrRedirect } from "@/features/auth/queries/get-auth-or-rerdirect"
import { ReactQueryProvider } from "../_providers/react-query/react-query-provider"
import { AppSidebar } from "../_navigation/sidebar/sidebar"

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  await getAdminOrRedirect()
  return <ReactQueryProvider>
    <div className="flex h-screen w-screen overflow-hidden border-collapse">
      <AppSidebar />
      <main
        className="min-h-screen w-full flex-1
             overflow-y-auto overflow-x-hidden
             bg-secondary/20
             flex flex-col">
        {children}
      </main>
    </div>
  </ReactQueryProvider>
}