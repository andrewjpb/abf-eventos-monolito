import { RedirectToast } from "@/components/redirect-toast";
import { Toaster } from "@/components/ui/sonner";

type RootTemplateProps = {
  children: React.ReactNode
}

export default function RootTemplate({ children }: RootTemplateProps) {
  return (
    <>
      {children}
      <Toaster />
      <RedirectToast />
    </>
  )
}
