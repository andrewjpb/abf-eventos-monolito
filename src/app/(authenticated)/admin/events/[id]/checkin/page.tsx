import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { getAdminEvent } from "@/features/events/admin/queries/get-admin-event"
import { notFound } from "next/navigation"
import { EventCheckinView } from "@/features/events/admin/components/event-checkin-view"

type EventCheckinPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventCheckinPage({ params }: EventCheckinPageProps) {
  // Verificar permissões de criar/editar eventos
  await getAuthWithPermissionOrRedirect("events.create")

  const { id } = await params
  const event = await getAdminEvent(id)

  if (!event) {
    return notFound()
  }

  return (
    <EventCheckinView event={event} />
  )
}