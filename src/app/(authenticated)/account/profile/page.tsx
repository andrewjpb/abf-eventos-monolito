import { getCurrentUser } from "@/features/account/queries/get-current-user"
import { notFound } from "next/navigation"
import { ProfileView } from "@/features/account/components/profile-view"

export default async function ProfilePage() {
  const userDetails = await getCurrentUser()
  
  if (!userDetails) {
    return notFound()
  }
  
  return (
    <ProfileView user={userDetails} currentUserId={userDetails.id} />
  )
}