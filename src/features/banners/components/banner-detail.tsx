// /features/banners/components/banner-detail.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Image as ImageIcon,
  Edit,
  Trash2,
  Power,
  PowerOff,
  ExternalLink,
  Globe,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BannerWithDetails } from "../types"
import { useConfirmDialog } from "@/components/confirm-dialog"
import Link from "next/link"
import { bannerEditPath, bannersPath } from "@/app/paths"
import Image from "next/image"
import { updateBannerStatus } from "../actions/update-banner-status"
import { deleteBanner } from "../actions/delete-banner"

type BannerDetailProps = {
  banner: BannerWithDetails & { isAuthorized: boolean }
}

export function BannerDetail({ banner }: BannerDetailProps) {
  // Dialog para excluir banner
  const [deleteButton, deleteDialog] = useConfirmDialog({
    action: deleteBanner.bind(null, banner.id),
    title: "Excluir Banner",
    description: `Tem certeza que deseja excluir o banner "${banner.title}"? Esta ação não pode ser desfeita.`,
    trigger: (
      <Button variant="destructive" size="sm">
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>
    )
  })

  // Dialog para ativar/desativar banner
  const [statusButton, statusDialog] = useConfirmDialog({
    action: updateBannerStatus.bind(null, banner.id, !banner.active),
    title: banner.active ? "Desativar Banner" : "Ativar Banner",
    description: `Tem certeza que deseja ${banner.active ? 'desativar' : 'ativar'} o banner "${banner.title}"?`,
    trigger: (
      <Button variant="outline" size="sm">
        {banner.active ? (
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
      {/* Imagem do banner */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <ImageIcon className="h-5 w-5 mr-2 text-primary" />
            Visualização do Banner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md overflow-hidden border border-border">
            <div className="relative aspect-[16/9] w-full">
              {banner.image_url ? (
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted/20">
                  <span className="text-muted-foreground">Imagem não disponível</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalhes do Banner */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ImageIcon className="h-5 w-5 mr-2 text-primary" />
              Informações do Banner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">ID do Banner</p>
                <p className="font-medium">{banner.id}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={banner.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                  {banner.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Título</p>
                <p className="font-medium">{banner.title}</p>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">URL da Imagem</p>
                <p className="font-medium text-sm break-all">{banner.image_url}</p>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Link Externo</p>
                <div className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <a
                    href={banner.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline break-all"
                  >
                    {banner.external_link}
                  </a>
                </div>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                <div className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <p className="font-medium">
                    {new Date(banner.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas e Métricas do Banner */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ExternalLink className="h-5 w-5 mr-2 text-primary" />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-52 items-center justify-center text-center p-6">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Estatísticas de desempenho e métricas do banner serão exibidas aqui em futuras atualizações.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={bannersPath()}>
                    Voltar para lista
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações para administradores */}
      {banner.isAuthorized && (
        <div className="flex justify-end gap-2">
          {statusButton}

          <Button variant="outline" size="sm" asChild>
            <Link href={bannerEditPath(banner.id)}>
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