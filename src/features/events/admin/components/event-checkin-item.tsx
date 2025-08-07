"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, XCircle, User, Mail, Building, MapPin, Briefcase, Phone, Hash, Trash2, ShieldCheck, Clock, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toggleCheckin } from "../actions/toggle-checkin"
import { removeAttendeeFromEvent } from "../actions/remove-attendee"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getParticipantTypeLabel, getParticipantTypeColor } from "@/features/attendance-list/constants/participant-types"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { formatNameForPrint } from "./printer-management"
import { useClientPrinter, type PrinterData } from "../utils/client-printer"

type Printer = {
  id: string
  name: string
  ip: string
  port: number
  isActive: boolean
}

type EventCheckinItemProps = {
  attendee: any
  eventId: string
  onUpdate?: () => void
  activePrinter?: Printer | null
}

export function EventCheckinItem({ attendee, eventId, onUpdate, activePrinter }: EventCheckinItemProps) {
  const [isPending, startTransition] = useTransition()
  const [isRemoving, startRemoveTransition] = useTransition()
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  
  const { printBadges } = useClientPrinter()

  const handleToggleCheckin = () => {
    const formData = new FormData()
    formData.append("attendanceId", attendee.id)
    formData.append("eventId", eventId)

    startTransition(async () => {
      try {
        const result = await toggleCheckin(null as any, formData)
        
        if (result.status === "SUCCESS") {
          toast.success(result.message)
          onUpdate?.()
        } else {
          toast.error(result.message || "Erro ao alterar check-in")
        }
      } catch (error) {
        toast.error("Erro ao alterar check-in")
      }
    })
  }

  const handleRemoveAttendee = () => {
    const formData = new FormData()
    formData.append("attendanceId", attendee.id)
    formData.append("eventId", eventId)

    startRemoveTransition(async () => {
      try {
        const result = await removeAttendeeFromEvent(null as any, formData)
        
        if (result.status === "SUCCESS") {
          toast.success(result.message)
          onUpdate?.()
        } else {
          toast.error(result.message || "Erro ao remover inscrito")
        }
      } catch (error) {
        toast.error("Erro ao remover inscrito")
      }
    })
  }

  const handlePrintSingle = async () => {
    if (!activePrinter) {
      toast.error("Nenhuma impressora ativa configurada")
      return
    }

    setIsPrinting(true)

    try {
      // Preparar dados para impressão client-side
      const printData: PrinterData[] = [{
        qr: `https://linkedin.com/in/${attendee.attendee_email?.split('@')[0] || attendee.id}`,
        name: formatNameForPrint(attendee.attendee_full_name),
        company: attendee.company?.name || "Empresa não associada",
        position: attendee.attendee_position || "Não informado"
      }]

      // Enviar via fetch client-side
      const success = await printBadges(activePrinter, printData)
      
      if (success) {
        toast.success(`Crachá de ${formatNameForPrint(attendee.attendee_full_name)} enviado para impressão`)
      } else {
        toast.error(`Falha na comunicação com ${activePrinter.ip}:${activePrinter.port}. Verifique a conexão de rede.`)
      }
    } catch (error) {
      console.error("Erro ao imprimir crachá:", error)
      toast.error("Erro ao imprimir crachá")
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-lg border transition-colors",
      attendee.checked_in 
        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
        : "bg-background hover:bg-accent/50"
    )}>
      <div className="flex items-center gap-4 flex-1">
        {/* Avatar */}
        <Avatar className="h-12 w-12">
          <AvatarImage 
            src={attendee.users?.thumb_url || attendee.users?.image_url} 
            alt={attendee.attendee_full_name} 
          />
          <AvatarFallback>
            {attendee.attendee_full_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium truncate">{attendee.attendee_full_name}</h3>
            <Badge 
              variant={attendee.checked_in ? "default" : "secondary"}
              className={cn(
                "text-xs",
                attendee.checked_in 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              )}
            >
              {attendee.checked_in ? "Presente" : "Pendente"}
            </Badge>
            <Badge 
              variant="outline"
              className={cn("text-xs", getParticipantTypeColor(attendee.participant_type))}
            >
              {getParticipantTypeLabel(attendee.participant_type)}
            </Badge>
            <Badge 
              variant="outline"
              className={cn(
                "text-xs flex items-center gap-1",
                attendee.users?.email_verified 
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" 
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
              )}
            >
              {attendee.users?.email_verified ? (
                <>
                  <ShieldCheck className="h-3 w-3" />
                  Confirmado
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  Rascunho
                </>
              )}
            </Badge>
            <Badge 
              variant="outline"
              className="text-xs bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
            >
              {new Date(attendee.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </Badge>
          </div>
          
          {/* Grid de informações em 2 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {/* Coluna 1 */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{attendee.attendee_email}</span>
              </div>
              
              {attendee.attendee_position && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{attendee.attendee_position}</span>
                </div>
              )}
              
              {attendee.mobile_phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{attendee.mobile_phone}</span>
                </div>
              )}
            </div>
            
            {/* Coluna 2 */}
            {attendee.company && (
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Building className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate font-medium">{attendee.company.name}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate font-mono text-xs">{attendee.company.cnpj}</span>
                </div>
                
                {attendee.company.segment && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{attendee.company.segment}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {activePrinter && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintSingle}
            disabled={isPending || isRemoving || isPrinting}
            className="min-w-28 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            {isPrinting ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Imprimindo...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Imprimir
              </div>
            )}
          </Button>
        )}

        <Button
          variant={attendee.checked_in ? "outline" : "default"}
          size="sm"
          onClick={handleToggleCheckin}
          disabled={isPending || isRemoving}
          className={cn(
            "min-w-32",
            attendee.checked_in
              ? "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
              : "bg-green-600 hover:bg-green-700 text-white"
          )}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              Processando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {attendee.checked_in ? (
                <>
                  <XCircle className="h-4 w-4" />
                  Remover Check-in
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Fazer Check-in
                </>
              )}
            </div>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRemoveDialog(true)}
          disabled={isPending || isRemoving}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
        >
          {isRemoving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Dialog de confirmação para remover */}
      <ConfirmDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        title="Remover inscrito"
        description={
          <>
            Tem certeza que deseja remover <strong>{attendee.attendee_full_name}</strong> deste evento?
            {attendee.participant_type === 'speaker' && (
              <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-md text-sm">
                <strong>Atenção:</strong> Este inscrito é um palestrante e também será removido da lista de palestrantes do evento.
              </div>
            )}
          </>
        }
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={handleRemoveAttendee}
        variant="destructive"
      />
    </div>
  )
}