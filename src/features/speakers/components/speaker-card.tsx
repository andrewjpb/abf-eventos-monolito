// /features/speakers/components/speaker-card.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  Briefcase,
  Mail,
  Phone,
  Building
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SpeakerCardProps } from "../types"
import Link from "next/link"
import { speakerPath } from "@/app/paths"
import Image from "next/image"

export function SpeakerCard({ speaker, expanded, onToggleExpand }: SpeakerCardProps) {
  const hasEvents = speaker.events && speaker.events.length > 0

  return (
    <Collapsible
      open={expanded}
      onOpenChange={() => onToggleExpand(speaker.id)}
      className="col-span-1"
    >
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md p-0">
        <CardContent className="p-0">
          {/* Cabeçalho */}
          <div className="p-4 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-2">
              {speaker.users.image_url ? (
                <div className="w-8 h-8 overflow-hidden rounded-full">
                  <Image
                    src={speaker.users.image_url}
                    alt={speaker.users.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
              <h4 className="font-medium truncate">{speaker.users.name}</h4>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={hasEvents ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}
              >
                {hasEvents ? `${speaker.events.length} evento${speaker.events.length !== 1 ? 's' : ''}` : 'Sem eventos'}
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
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{speaker.users.position || 'Não informado'}</span>
            </div>
            {speaker.users.company && (
              <div className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{speaker.users.company.name}</span>
              </div>
            )}
          </div>

          {/* Detalhes expandidos */}
          <CollapsibleContent>
            <div className="p-4 space-y-4 bg-gradient-to-b from-muted/10 to-transparent">
              {speaker.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="text-sm">{speaker.description}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{speaker.users.email}</span>
                </div>

                {speaker.users.mobile_phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{speaker.users.mobile_phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{speaker.users.city}/{speaker.users.state}</span>
                </div>
              </div>

              {hasEvents && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Eventos</p>
                  <div className="flex flex-wrap gap-2">
                    {speaker.events.slice(0, 3).map(event => (
                      <Badge key={event.id} variant="outline" className="bg-primary/5">
                        {event.title}
                      </Badge>
                    ))}
                    {speaker.events.length > 3 && (
                      <Badge variant="outline">
                        +{speaker.events.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Link href={speakerPath(speaker.id)} className="pt-2 flex justify-end">
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