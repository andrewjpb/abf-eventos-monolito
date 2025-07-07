import { getCurrentUser } from "@/features/account/queries/get-current-user"
import { notFound } from "next/navigation"
import { ProfileView } from "@/features/account/components/profile-view"

export default async function ProfilePage() {
  const userDetails = await getCurrentUser()
  
  if (!userDetails) {
    return notFound()
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <ProfileView user={userDetails} currentUserId={userDetails.id} />
    </div>
  )
}