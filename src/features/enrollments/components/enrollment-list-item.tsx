// /features/enrollments/components/enrollment-list-item.tsx
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EnrollmentWithDetails } from "../types"
import { Calendar, Building, MapPin, User, Mail, Phone, FileText } from "lucide-react"
import Link from "next/link"
import { eventPath } from "@/app/paths"

interface EnrollmentListItemProps {
  enrollment: EnrollmentWithDetails
}

export function EnrollmentListItem({ enrollment }: EnrollmentListItemProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header com evento e status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Link
              href={eventPath(enrollment.events.id)}
              className="font-medium text-primary hover:underline"
            >
              {enrollment.events.title}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={enrollment.checked_in ? "default" : "secondary"}
              className={enrollment.checked_in ? "bg-green-100 text-green-800 border-green-200" : ""}
            >
              {enrollment.checked_in ? "Check-in feito" : "Pendente"}
            </Badge>
            <Badge variant="outline">
              {enrollment.attendee_type === 'in_person' ? 'Presencial' : (enrollment.attendee_type === 'online' ? 'Online' : enrollment.attendee_type || 'Não informado')}
            </Badge>
          </div>
        </div>

        {/* Informações do participante */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{enrollment.attendee_full_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{enrollment.attendee_email}</span>
            </div>
            {enrollment.mobile_phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{enrollment.mobile_phone}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{enrollment.company.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{enrollment.company_segment}</span>
            </div>
            {enrollment.attendee_position && (
              <div className="text-sm text-muted-foreground">
                {enrollment.attendee_position}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {enrollment.events.is_international
                  ? `${enrollment.events.location_city}, ${enrollment.events.location_country}`
                  : enrollment.events.address
                    ? `${enrollment.events.address.cities.name}, ${enrollment.events.address.states.name}`
                    : 'Local a definir'
                }
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Data do evento: {new Date(enrollment.events.date).toLocaleDateString('pt-BR')}
            </div>
            <div className="text-sm text-muted-foreground">
              Inscrito em: {new Date(enrollment.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Documentos */}
        <div className="pt-2 border-t border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">CPF:</span> {enrollment.attendee_cpf}
            </div>
            <div>
              <span className="font-medium">RG:</span> {enrollment.attendee_rg}
            </div>
            <div>
              <span className="font-medium">CNPJ:</span> {enrollment.company_cnpj}
            </div>
            <div>
              <span className="font-medium">ID:</span> {enrollment.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}