import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { LucideSlash } from "lucide-react"
import Link from "next/link"
import { Fragment } from "react"

type BreadcrumbsProps = {
  breadcrumbs: {
    title: string
    href?: string
    icon?: React.ReactNode
  }[]
}

const Breadcrumbs = (
  { breadcrumbs }: BreadcrumbsProps
) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => {
          let breadcrumbItem = <BreadcrumbItem>{breadcrumb.title}</BreadcrumbItem>

          if (breadcrumb.href) {
            breadcrumbItem = (
              <BreadcrumbLink asChild>
                <Link
                  href={breadcrumb.href}
                  className="flex items-center  gap-1">
                  {breadcrumb.icon}
                  {breadcrumb.title}
                </Link>
              </BreadcrumbLink>
            )
          }


          return (
            <Fragment
              key={breadcrumb.title}>
              {breadcrumbItem}
              {index < breadcrumbs.length - 1 && (
                <BreadcrumbSeparator>
                  <LucideSlash className="w-4 h-4" />
                </BreadcrumbSeparator>
              )}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export { Breadcrumbs }
