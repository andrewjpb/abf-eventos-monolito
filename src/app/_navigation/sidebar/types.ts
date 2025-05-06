
export type NavItem = {
  title: string
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>
  href: string
  separator?: boolean
  role?: string
  subItems?: {
    title: string;
    href: string;
    role?: string;
  }[];
}