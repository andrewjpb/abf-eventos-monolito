// /features/supporters/components/supporter-detail.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building,
  CalendarDays,
  Edit,
  Trash2,
  Power,
  PowerOff,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupporterWithEvents } from "../types"
import { Separator } from "@/components/ui/separator"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { deleteSupporter } from "../actions/delete-supporter"
import { updateSupporterStatus } from "../actions/update-supporter-status"
import Link from "next/link"
import { supporterEditPath, eventPath } from "@/app/paths"
import { SupporterCard } from "./supporter-card"
import { useState } from "react"
import Image from "next/image"

type SupporterDetailProps = {
  supporter: SupporterWithEvents & { isAuthorized: boolean }
}

export function SupporterDetail({ supporter }: SupporterDetailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(supporter.id)

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Dialog para excluir apoiador
  const [deleteButton, deleteDialog] = useConfirmDialog({
    action: deleteSupporter.bind(null, supporter.id),
    title: "Excluir Apoiador",
    description: `Tem certeza que deseja excluir o apoiador ${supporter.name}? Esta ação não pode ser desfeita.`,
    trigger: (
      <Button variant="destructive" size="sm">
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>
    )
  })

  // Dialog para ativar/desativar apoiador
  const [statusButton, statusDialog] = useConfirmDialog({
    action: updateSupporterStatus.bind(null, supporter.id, !supporter.active),
    title: supporter.active ? "Desativar Apoiador" : "Ativar Apoiador",
    description: `Tem certeza que deseja ${supporter.active ? 'desativar' : 'ativar'} o apoiador ${supporter.name}?`,
    trigger: (
      <Button variant="outline" size="sm">
        {supporter.active ? (
          <>
            <PowerOff className="mr-2 h-4 w-4" />
            Desativar
          </>
        ) : (
          <>
            <Power className="mr-2 h-4 w-4" />
            Ativar
          </>
        )}
      </Button>
    )
  })

  return (
    <div className="space-y-8">
      {/* Cartão de visualização rápida */}
      <SupporterCard
        supporter={supporter}
        expanded={expandedId === supporter.id}
        onToggleExpand={handleToggleExpand}
      />

      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalhes do Apoiador */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Building className="h-5 w-5 mr-2 text-primary" />
              Informações do Apoiador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">ID do Apoiador</p>
                <p className="font-medium">{supporter.id}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={supporter.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                  {supporter.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{supporter.name}</p>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                <div className="flex items-center">
                  <CalendarDays className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <p className="font-medium">
                    {new Date(supporter.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Mostrar imagem se disponível */}
            {supporter.image_url && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Imagem</p>
                  <div className="rounded overflow-hidden border p-2 flex justify-center">
                    <Image
                      src={supporter.image_url}
                      alt={supporter.name}
                      width={300}
                      height={150}
                      className="object-contain"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Eventos do Apoiador */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-primary" />
              Eventos Relacionados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supporter.events && supporter.events.length > 0 ? (
              <div className="space-y-4">
                {supporter.events.map((event) => (
                  <div key={event.id} className="border rounded-md p-3 hover:bg-muted/20 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('pt-BR')} | {event.start_time} - {event.end_time}
                        </p>
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
                  Este apoiador não está associado a nenhum evento
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações para administradores */}
      {supporter.isAuthorized && (
        <div className="flex justify-end gap-2">
          {statusButton}

          <Button variant="outline" size="sm" asChild>
            <Link href={supporterEditPath(supporter.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>

          {deleteButton}
        </div>
      )}

      {/* Dialogs de confirmação */}
      {deleteDialog}
      {statusDialog}
    </div>
  )
}