import { AppSidebar } from "@/app/_navigation/sidebar/sidebar"
import { ReactQueryProvider } from "../../_providers/react-query/react-query-provider"

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <ReactQueryProvider>
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col bg-secondary/20">
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  </ReactQueryProvider>
}