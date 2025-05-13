// /features/sponsors/components/sponsor-card.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  CalendarDays
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SponsorCardProps } from "../types"
import Link from "next/link"
import { sponsorPath } from "@/app/paths"
import Image from "next/image"

export function SponsorCard({ sponsor, expanded, onToggleExpand }: SponsorCardProps) {
  const hasEvents = sponsor.events && sponsor.events.length > 0

  return (
    <Collapsible
      open={expanded}
      onOpenChange={() => onToggleExpand(sponsor.id)}
      className="col-span-1"
    >
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md p-0">
        <CardContent className="p-0">
          {/* Cabeçalho */}
          <div className="p-4 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-2">
              {sponsor.thumb_url ? (
                <div className="w-8 h-8 overflow-hidden rounded">
                  <Image
                    src={sponsor.thumb_url}
                    alt={sponsor.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              ) : (
                <Building className="h-5 w-5 text-primary" />
              )}
              <h4 className="font-medium truncate">{sponsor.name}</h4>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`font-normal text-xs ${sponsor.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
              >
                {sponsor.active ? 'Ativo' : 'Inativo'}
              </Badge>

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Resumo - sempre visível */}
          <div className="px-4 py-3 bg-muted/20 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{hasEvents ? `${sponsor.events.length} evento${sponsor.events.length > 1 ? 's' : ''}` : 'Nenhum evento'}</span>
            </div>
          </div>

          {/* Detalhes expandidos */}
          <CollapsibleContent>
            <div className="p-4 space-y-4 bg-gradient-to-b from-muted/10 to-transparent">
              {sponsor.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="text-sm">{sponsor.description}</p>
                </div>
              )}

              {hasEvents && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Eventos</p>
                  <div className="flex flex-wrap gap-2">
                    {sponsor.events.slice(0, 3).map(event => (
                      <Badge key={event.id} variant="outline" className="bg-primary/5">
                        {event.title}
                      </Badge>
                    ))}
                    {sponsor.events.length > 3 && (
                      <Badge variant="outline">
                        +{sponsor.events.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Link href={sponsorPath(sponsor.id)} className="pt-2 flex justify-end">
                <Button variant="outline" size="sm" className="h-8">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Detalhes
                </Button>
              </Link>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  )
}