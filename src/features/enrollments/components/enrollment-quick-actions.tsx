// /features/enrollments/components/enrollment-quick-actions.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { enrollmentsByEventPath, eventPath } from "@/app/paths"

interface EnrollmentQuickActionsProps {
  eventId: string
  eventTitle: string
  enrollmentCount: number
  vacancyTotal: number
  occupancyRate: number
}

export function EnrollmentQuickActions({
  eventId,
  eventTitle,
  enrollmentCount,
  vacancyTotal,
  occupancyRate
}: EnrollmentQuickActionsProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex-1">
        <h3 className="font-medium text-sm truncate max-w-[200px]">{eventTitle}</h3>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {enrollmentCount} inscritos
          </span>
          <span>
            {enrollmentCount}/{vacancyTotal} vagas
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant={occupancyRate >= 100 ? "destructive" : occupancyRate >= 75 ? "default" : "secondary"}
          className="text-xs"
        >
          {occupancyRate.toFixed(1)}%
        </Badge>

        <div className="flex gap-1">
          <Button variant="outline" size="sm" asChild>
            <Link href={eventPath(eventId)}>
              <Eye className="h-3 w-3" />
            </Link>
          </Button>

          <Button variant="default" size="sm" asChild>
            <Link href={enrollmentsByEventPath(eventId)}>
              <TrendingUp className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}