import { Lucia } from "lucia"
import { PrismaAdapter } from "@lucia-auth/adapter-prisma"
import { prisma } from "./prisma"

const adapter = new PrismaAdapter(
  prisma.session,
  prisma.users
)

export const lucia = new Lucia(adapter,
  {
    sessionCookie: {
      expires: false,
      attributes: {
        secure: process.env.NODE_ENV === "production",
      },
    },
    getUserAttributes: (attributes) => ({
      // Basic user info
      id: attributes.id,
      email: attributes.email,
      username: attributes.name,

      // Personal information
      rg: attributes.rg,
      cpf: attributes.cpf,
      mobilePhone: attributes.mobile_phone,

      // Professional information
      position: attributes.position,
      companyId: attributes.cnpj,

      // Location information
      city: attributes.city,
      state: attributes.state,

      // Profile images
      picture: attributes.image_url,
      thumbUrl: attributes.thumb_url,

      // Account status
      active: attributes.active,

      // Role-based access control - just pass through the roles array
      // We'll enhance it with methods in getAuth
      roles: attributes.roles,
    }),
  }
)

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: DatabaseUserAttributes
  }
}

interface DatabaseUserAttributes {
  id: string
  name: string
  username: string
  email: string
  password: string
  active: boolean
  rg: string
  cpf: string
  cnpj: string
  mobile_phone: string
  position: string
  city: string
  state: string
  image_url: string
  thumb_url: string
  image_path: string
  thumb_path: string
  created_at: Date
  updatedAt: Date
  roles: any[]

}

// Helper type for the attributes that will be available on the user object
export interface UserAttributes {
  id: string
  email: string
  username: string
  rg: string
  cpf: string
  mobilePhone: string
  position: string
  companyId: string
  city: string
  state: string
  picture: string
  thumbUrl: string
  active: boolean
  roles: string[]
  permissions: string[]
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
}