import { User as AuthUser } from "lucia"

type Entity = {
  userId: string
}

export const isOwner = (
  entity: Entity | null | undefined, authUser: AuthUser | null | undefined
) => {

  if (!entity || !authUser) return false

  if (!entity.userId) return false


  if (entity.userId !== authUser.id) {
    return false
  } else {
    return true
  }

}
