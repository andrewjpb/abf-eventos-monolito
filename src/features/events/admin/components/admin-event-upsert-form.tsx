"use client"

import React, { useState, useRef } from "react"
import { FieldError } from "@/components/form/field-error"
import { Form } from "@/components/form/form"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useActionState } from "react"
import { LucideLoaderCircle, Save, Upload, X, Calendar, MapPin, Users, Clock, Link as LinkIcon, Image as ImageIcon } from "lucide-react"
import clsx from "clsx"
import Image from "next/image"
import { toast } from "sonner"
import { AdminEventWithDetails, EVENT_FORMATS } from "../types"
import { upsertEvent } from "../actions/upsert-event"

type AdminEventUpsertFormProps = {
  event?: AdminEventWithDetails
  addresses: Array<{
    id: string
    label: string
    city: string
    state: string
    uf: string
  }>
  speakers: Array<{
    id: string
    name: string
    email: string
    position: string
  }>
  sponsors: Array<{
    id: string
    name: string
  }>
  supporters: Array<{
    id: string
    name: string
  }>
}

export function AdminEventUpsertForm({ 
  event, 
  addresses, 
  speakers, 
  sponsors, 
  supporters 
}: AdminEventUpsertFormProps) {
  const [actionState, action, pending] = useActionState(
    upsertEvent.bind(null, event?.id),
    EMPTY_ACTION_STATE
  )

  // Estado para controlar a seleção dos arquivos
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedThumbFile, setSelectedThumbFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(event?.image_url || null)
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(event?.thumb_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbFileInputRef = useRef<HTMLInputElement>(null)

  // Estados para relacionamentos
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>(
    event?.speakers?.map(s => s.id) || []
  )
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>(
    event?.sponsors?.map(s => s.id) || []
  )
  const [selectedSupporters, setSelectedSupporters] = useState<string[]>(
    event?.supporters?.map(s => s.id) || []
  )

  // Função para lidar com a seleção de imagem
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validação do tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um arquivo de imagem válido")
      return
    }

    // Validação do tamanho do arquivo (limite de 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. O tamanho máximo é 10MB")
      return
    }

    setSelectedFile(file)

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreviewUrl(event?.image_url || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Função para lidar com a seleção de miniatura
  const handleThumbSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validação do tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um arquivo de imagem válido")
      return
    }

    // Validação do tamanho do arquivo (limite de 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. O tamanho máximo é 10MB")
      return
    }

    setSelectedThumbFile(file)

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setThumbPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveThumb = () => {
    setSelectedThumbFile(null)
    setThumbPreviewUrl(event?.thumb_url || null)
    if (thumbFileInputRef.current) {
      thumbFileInputRef.current.value = ""
    }
  }

  // Funções para gerenciar relacionamentos
  const toggleSelection = (id: string, current: string[], setter: (ids: string[]) => void) => {
    if (current.includes(id)) {
      setter(current.filter(item => item !== id))
    } else {
      setter([...current, id])
    }
  }

  // Formatar data para input datetime-local
  const formatDateForInput = (date: Date) => {
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  // Gerar slug a partir do título
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    const slugInput = document.getElementById('slug') as HTMLInputElement
    if (slugInput && !event) { // Só gerar slug automaticamente na criação
      slugInput.value = generateSlug(title)
    }
  }

  return (
    <Form action={action} actionState={actionState}>
      <div className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título do Evento *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Conferência de Tecnologia 2024"
                defaultValue={event?.title}
                onChange={handleTitleChange}
                required
              />
              <FieldError actionState={actionState} name="title" />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL amigável) *</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="conferencia-tecnologia-2024"
                defaultValue={event?.slug}
                required
              />
              <FieldError actionState={actionState} name="slug" />
              <p className="text-xs text-muted-foreground">
                Usado na URL do evento. Apenas letras minúsculas, números e hífens.
              </p>
            </div>

            {/* Resumo */}
            <div className="space-y-2">
              <Label htmlFor="summary">Resumo *</Label>
              <Textarea
                id="summary"
                name="summary"
                placeholder="Resumo curto sobre o evento..."
                defaultValue={event?.summary}
                rows={3}
                required
              />
              <FieldError actionState={actionState} name="summary" />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição Completa *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descrição detalhada do evento..."
                defaultValue={event?.description}
                rows={6}
                required
              />
              <FieldError actionState={actionState} name="description" />
            </div>
          </CardContent>
        </Card>

        {/* Data e Local */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Data e Local
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date">Data do Evento *</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                defaultValue={event ? formatDateForInput(event.date) : ""}
                required
              />
              <FieldError actionState={actionState} name="date" />
            </div>

            {/* Horários */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Horário de Início *</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  defaultValue={event?.start_time}
                  required
                />
                <FieldError actionState={actionState} name="start_time" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">Horário de Término *</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  defaultValue={event?.end_time}
                  required
                />
                <FieldError actionState={actionState} name="end_time" />
              </div>
            </div>

            {/* Formato */}
            <div className="space-y-2">
              <Label htmlFor="format">Formato do Evento *</Label>
              <Select name="format" defaultValue={event?.format}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_FORMATS.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError actionState={actionState} name="format" />
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="addressId">Endereço *</Label>
              <Select name="addressId" defaultValue={event?.addressId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o endereço" />
                </SelectTrigger>
                <SelectContent>
                  {addresses.map(address => (
                    <SelectItem key={address.id} value={address.id}>
                      {address.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError actionState={actionState} name="addressId" />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Vagas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Configurações de Vagas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vacancy_total">Total de Vagas *</Label>
                <Input
                  id="vacancy_total"
                  name="vacancy_total"
                  type="number"
                  min="1"
                  defaultValue={event?.vacancy_total}
                  required
                />
                <FieldError actionState={actionState} name="vacancy_total" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vacancies_per_brand">Vagas por Marca</Label>
                <Input
                  id="vacancies_per_brand"
                  name="vacancies_per_brand"
                  type="number"
                  min="0"
                  defaultValue={event?.vacancies_per_brand}
                />
                <FieldError actionState={actionState} name="vacancies_per_brand" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_quorum">Quórum Mínimo</Label>
                <Input
                  id="minimum_quorum"
                  name="minimum_quorum"
                  type="number"
                  min="0"
                  defaultValue={event?.minimum_quorum}
                />
                <FieldError actionState={actionState} name="minimum_quorum" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Transmissão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Transmissão e Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isStreaming">Evento com transmissão online</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar se o evento terá transmissão ao vivo
                  </p>
                </div>
                <Switch
                  id="isStreaming"
                  name="isStreaming"
                  defaultChecked={event?.isStreaming}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="free_online">Evento gratuito online</Label>
                  <p className="text-sm text-muted-foreground">
                    Marcar se for um evento online gratuito
                  </p>
                </div>
                <Switch
                  id="free_online"
                  name="free_online"
                  defaultChecked={event?.free_online}
                />
              </div>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transmission_link">Link de Transmissão</Label>
                <Input
                  id="transmission_link"
                  name="transmission_link"
                  placeholder="https://exemplo.com/transmissao"
                  defaultValue={event?.transmission_link}
                />
                <FieldError actionState={actionState} name="transmission_link" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule_link">Link da Programação</Label>
                <Input
                  id="schedule_link"
                  name="schedule_link"
                  placeholder="https://exemplo.com/programacao"
                  defaultValue={event?.schedule_link}
                />
                <FieldError actionState={actionState} name="schedule_link" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Imagens do Evento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Imagens do Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Imagem Principal */}
            <div className="space-y-4">
              <h4 className="font-semibold">Imagem Principal</h4>
              
              {/* Preview da imagem principal */}
              <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden bg-muted border">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Preview da imagem principal do evento"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground opacity-30" />
                  </div>
                )}
              </div>

              {/* Upload da imagem principal */}
              <div className="space-y-2">
                <Label htmlFor="image_file">Imagem Principal</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    id="image_file"
                    name="image_file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="flex-1"
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FieldError actionState={actionState} name="image_file" />
                <p className="text-xs text-muted-foreground">
                  Imagem principal usada na página de detalhes do evento.
                </p>
              </div>
            </div>

            {/* Miniatura */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Miniatura (Carrossel)</h4>
              
              {/* Preview da miniatura */}
              <div className="relative aspect-video w-full max-w-sm rounded-lg overflow-hidden bg-muted border">
                {thumbPreviewUrl ? (
                  <Image
                    src={thumbPreviewUrl}
                    alt="Preview da miniatura do evento"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground opacity-30" />
                  </div>
                )}
              </div>

              {/* Upload da miniatura */}
              <div className="space-y-2">
                <Label htmlFor="thumb_file">Miniatura</Label>
                <div className="flex gap-2">
                  <Input
                    ref={thumbFileInputRef}
                    id="thumb_file"
                    name="thumb_file"
                    type="file"
                    accept="image/*"
                    onChange={handleThumbSelect}
                    className="flex-1"
                  />
                  {selectedThumbFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveThumb}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FieldError actionState={actionState} name="thumb_file" />
                <p className="text-xs text-muted-foreground">
                  Miniatura usada no carrossel e listagens. Formatos aceitos: JPG, PNG, GIF, WEBP. Tamanho máximo: 10MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Publicação */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Publicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isPublished">Publicar evento</Label>
                <p className="text-sm text-muted-foreground">
                  Tornar o evento visível para o público
                </p>
              </div>
              <Switch
                id="isPublished"
                name="isPublished"
                defaultChecked={event?.isPublished}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="highlight">Destacar evento</Label>
                <p className="text-sm text-muted-foreground">
                  Exibir o evento em posição de destaque
                </p>
              </div>
              <Switch
                id="highlight"
                name="highlight"
                defaultChecked={event?.highlight}
              />
            </div>
          </CardContent>
        </Card>

        {/* Relacionamentos - campos hidden para IDs selecionados */}
        <input type="hidden" name="speakerIds" value={selectedSpeakers.join(',')} />
        <input type="hidden" name="sponsorIds" value={selectedSponsors.join(',')} />
        <input type="hidden" name="supporterIds" value={selectedSupporters.join(',')} />

        {/* Botões de ação */}
        <div className="flex gap-4 pt-6">
          <Button
            type="submit"
            disabled={pending}
            className="flex-1 md:flex-none"
          >
            {pending ? (
              <LucideLoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {event ? 'Atualizar Evento' : 'Criar Evento'}
          </Button>
        </div>
      </div>
    </Form>
  )
}