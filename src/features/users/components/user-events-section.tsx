// /features/users/components/user-events-section.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Check, X } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { eventPath } from "@/app/paths"

type Event = {
  id: string;
  title: string;
  date: Date;
  format: string;
}

type Attendance = {
  id: string;
  eventId: string;
  checked_in: boolean;
  events: Event;
}

type UserEventsSectionProps = {
  attendances: Attendance[];
}

export function UserEventsSection({ attendances }: UserEventsSectionProps) {
  if (!attendances || attendances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Participação em Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-muted/20 rounded-md">
            <p className="text-muted-foreground">
              Este usuário não participou de nenhum evento.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Participação em Eventos
          </div>
          <Badge variant="outline">
            {attendances.length} evento{attendances.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {attendances.map(attendance => (
            <div key={attendance.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-md">
              <div>
                <h3 className="font-medium">{attendance.events.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {format(new Date(attendance.events.date), 'dd/MM/yyyy')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {attendance.events.format}
                  </Badge>
                  <Badge
                    variant={attendance.checked_in ? "default" : "secondary"}
                    className="text-xs flex items-center"
                  >
                    {attendance.checked_in ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Check-in realizado
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Não compareceu
                      </>
                    )}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-2 sm:mt-0" asChild>
                <Link href={eventPath(attendance.eventId)}>
                  Ver evento
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}