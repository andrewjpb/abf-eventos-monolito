import { bannerEditPath, bannerPath } from "@/app/paths";
import { Form } from "@/components/form/form";
import { Card } from "@/components/ui/card";
import { BannerWithDetails } from "../types";
import Image from "next/image";
import { useActionState } from "react";
import { updateBannerStatus } from "../actions/update-banner-status";
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/form/submit-button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface BannerCardItemListProps {
  banner: BannerWithDetails
  onStatusChange: (bannerId: string, newStatus: boolean) => void
}

export function BannerCardItemList({ banner, onStatusChange }: BannerCardItemListProps) {

  const [actionState, action] = useActionState(
    updateBannerStatus.bind(null, banner?.id, !banner?.active),
    EMPTY_ACTION_STATE
  )


  return (
    <Card key={banner.id} className="overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-border/50">
        <h4 className="font-medium truncate">{banner.title}</h4>
        <Badge
          className={`font-normal text-xs ${banner.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
        >
          {banner.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Miniatura do banner */}
        <div className="w-full md:w-1/3 p-4 relative bg-muted/10 flex items-center justify-center md:border-r">
          <div className="aspect-[16/9] w-full relative max-h-[180px]">
            {banner.image_url ? (
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-muted-foreground">Sem imagem</span>
              </div>
            )}
          </div>
        </div>

        {/* Detalhes e ações */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">URL da Imagem</p>
                <p className="font-medium text-sm truncate">{banner.image_url}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Link Externo</p>
                <a
                  href={banner.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sm text-primary hover:underline truncate block"
                >
                  {banner.external_link}
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Criado em</p>
              <p className="font-medium">
                {new Date(banner.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between mt-4 pt-2 border-t">
            <Form action={action} actionState={actionState} onSuccess={() => onStatusChange(banner.id, !banner.active)}>
              <SubmitButton variant={`${banner.active ? 'destructive' : 'default'}`} label={`${banner.active ? 'Desativar' : 'Ativar'}`} />
            </Form>

            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={bannerEditPath(banner.id)}>
                  Editar
                </Link>
              </Button>
              <Button asChild variant="destructive" size="sm">
                <Link href={bannerPath(banner.id)}>
                  Gerenciar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
