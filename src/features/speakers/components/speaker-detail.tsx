// /features/speakers/components/speaker-detail.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User,
  CalendarDays,
  Edit,
  Trash2,
  ExternalLink,
  Briefcase,
  Mail,
  Phone,
  Building
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SpeakerWithAuth } from "../types"
import { Separator } from "@/components/ui/separator"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { deleteSpeaker } from "../actions/delete-speaker"
import Link from "next/link"
import { speakerEditPath, eventPath } from "@/app/paths"
import { SpeakerCard } from "./speaker-card"
import { useState } from "react"
import Image from "next/image"

type SpeakerDetailProps = {
  speaker: SpeakerWithAuth
}

export function SpeakerDetail({ speaker }: SpeakerDetailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(speaker.id)

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Dialog para excluir palestrante
  const [deleteButton, deleteDialog] = useConfirmDialog({
    action: deleteSpeaker.bind(null, speaker.id),
    title: "Excluir Palestrante",
    description: `Tem certeza que deseja excluir o palestrante ${speaker.users.name}? Esta ação não pode ser desfeita.`,
    trigger: (
      <Button variant="destructive" size="sm">
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>
    )
  })

  const hasEvents = speaker.events && speaker.events.length > 0

  return (
    <div className="space-y-8">
      {/* Cartão de visualização rápida */}
      <SpeakerCard
        speaker={speaker}
        expanded={expandedId === speaker.id}
        onToggleExpand={handleToggleExpand}
      />

      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalhes do Palestrante */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              Informações do Palestrante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">ID do Palestrante</p>
                <p className="font-medium">{speaker.id}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <div className="flex items-center">
                  <Building className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <p className="font-medium">{speaker.users.company?.name || 'N/A'}</p>
                </div>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{speaker.users.name}</p>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Cargo</p>
                <p className="font-medium">{speaker.users.position || 'Não informado'}</p>
              </div>

              {speaker.description && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Biografia</p>
                  <p className="text-sm">{speaker.description}</p>
                </div>
              )}

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <p className="font-medium">{speaker.users.email}</p>
                </div>
              </div>

              {speaker.users.mobile_phone && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <div className="flex items-center">
                    <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <p className="font-medium">{speaker.users.mobile_phone}</p>
                  </div>
                </div>
              )}

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Localização</p>
                <p className="font-medium">{speaker.users.city}/{speaker.users.state}</p>
              </div>
            </div>

            {/* Mostrar imagem se disponível */}
            {speaker.users.image_url && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Imagem</p>
                  <div className="rounded overflow-hidden border p-2 flex justify-center">
                    <Image
                      src={speaker.users.image_url}
                      alt={speaker.users.name}
                      width={150}
                      height={150}
                      className="object-contain rounded-full"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Eventos do Palestrante */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-primary" />
              Eventos Relacionados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasEvents ? (
              <div className="space-y-4">
                {speaker.events.map((event) => (
                  <div key={event.id} className="border rounded-md p-3 hover:bg-muted/20 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('pt-BR')} | {event.start_time} - {event.end_time}
                        </p>
                        <Badge className="mt-1" variant="outline">
                          {event.format}
                        </Badge>
                      </div>
                      <Link href={eventPath(event.id)} className="flex-shrink-0">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                  <CalendarDays className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Este palestrante não está associado a nenhum evento
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações para administradores */}
      {speaker.isAuthorized && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={speakerEditPath(speaker.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>

          {deleteButton}
        </div>
      )}

      {/* Dialogs de confirmação */}
      {deleteDialog}
    </div>
  )
}