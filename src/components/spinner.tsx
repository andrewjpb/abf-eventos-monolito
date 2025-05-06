import { LucideLoaderCircle } from "lucide-react"

const Spinner = () => {
  return (
    <div className="flex-1 flex items-center justify-center self-center">
      <LucideLoaderCircle className="w-10 h-10 animate-spin" />
    </div>
  )
}
export { Spinner }
