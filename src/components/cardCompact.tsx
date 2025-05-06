import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Image from "next/image"

type CardCompactProps = {
  title?: string
  description: string
  content: React.ReactNode
  footer?: React.ReactNode
  className?: string
  showLogo?: boolean
}

const CardCompact = ({ title, description, content, footer, className, showLogo = true }: CardCompactProps) => {
  return <Card className={cn(className)}>
    <CardHeader>
      {showLogo && <div className="flex justify-center pb-4 filter dark:contrast-0"> <Image src="/logo-blue.webp" alt="logo" width={210} height={30} className="filter" /></div>}
      <CardTitle className="text-2xl font-semibold"> {title}</CardTitle>
      <CardDescription> {description}</CardDescription>
    </CardHeader>
    <CardContent>
      {content}
    </CardContent>
    {footer && <CardFooter> {footer} </CardFooter>}
  </Card>
}


export { CardCompact }
