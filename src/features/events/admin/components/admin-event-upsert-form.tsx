"use client"

import React, { useState, useRef, useEffect } from "react"
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
  states: Array<{
    id: string
    name: string
    uf: string
  }>
  cities: Array<{
    id: string
    name: string
    stateId: string | null
  }>
}

export function AdminEventUpsertForm({ 
  event, 
  speakers, 
  sponsors, 
  supporters,
  states,
  cities 
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
  const [isCompressing, setIsCompressing] = useState(false)
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

  // Estado para formato do evento
  const [selectedFormat, setSelectedFormat] = useState<string>(event?.format || '')
  const [freeOnline, setFreeOnline] = useState<boolean>(event?.free_online || false)

  // Estados para endereço
  const [isInternational, setIsInternational] = useState<boolean>(event?.is_international || false)
  const [selectedState, setSelectedState] = useState<string>(event?.address?.stateId || '')
  const [filteredCities, setFilteredCities] = useState(
    cities.filter(city => city.stateId === (event?.address?.stateId || '') && city.stateId !== null)
  )

  // Atualizar cidades filtradas quando o estado inicial for carregado
  useEffect(() => {
    if (event?.address?.stateId) {
      const stateId = event.address.stateId
      setSelectedState(stateId)
      setFilteredCities(cities.filter(city => city.stateId === stateId && city.stateId !== null))
    }
  }, [event?.address?.stateId, cities])

  // Função para lidar com a seleção de imagem
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validação do tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("❌ Por favor, selecione um arquivo de imagem válido (JPG, PNG, GIF, WEBP)")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    // Validação de formatos específicos
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("❌ Formato não suportado. Use apenas JPG, PNG, GIF ou WEBP")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    // Validação do tamanho do arquivo (limite de 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`❌ Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O tamanho máximo é 5MB`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    // Mostrar tamanho original
    const originalSize = (file.size / 1024).toFixed(1)
    toast.info(`📁 Arquivo original: ${originalSize}KB`)

    // Comprimir imagem se for maior que 1MB
    let processedFile = file
    if (file.size > 1024 * 1024) {
      setIsCompressing(true)
      toast.info("🔄 Comprimindo imagem para melhor performance...")
      
      try {
        processedFile = await compressImage(file, 1920, 0.8)
        const compressedSize = (processedFile.size / 1024).toFixed(1)
        toast.success(`✅ Imagem comprimida: ${compressedSize}KB (${((1 - processedFile.size / file.size) * 100).toFixed(1)}% menor)`)
      } catch (error) {
        toast.warning("⚠️ Erro na compressão, usando arquivo original")
        processedFile = file
      }
      
      setIsCompressing(false)
    }

    setSelectedFile(processedFile)

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(processedFile)
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreviewUrl(event?.image_url || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Função para lidar com a seleção de miniatura
  const handleThumbSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validação do tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("❌ Por favor, selecione um arquivo de imagem válido (JPG, PNG, GIF, WEBP)")
      if (thumbFileInputRef.current) {
        thumbFileInputRef.current.value = ""
      }
      return
    }

    // Validação de formatos específicos
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("❌ Formato não suportado. Use apenas JPG, PNG, GIF ou WEBP")
      if (thumbFileInputRef.current) {
        thumbFileInputRef.current.value = ""
      }
      return
    }

    // Validação do tamanho do arquivo (limite de 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`❌ Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O tamanho máximo é 5MB`)
      if (thumbFileInputRef.current) {
        thumbFileInputRef.current.value = ""
      }
      return
    }

    // Mostrar tamanho original
    const originalSize = (file.size / 1024).toFixed(1)
    toast.info(`📁 Miniatura original: ${originalSize}KB`)

    // Comprimir imagem se for maior que 1MB
    let processedFile = file
    if (file.size > 1024 * 1024) {
      setIsCompressing(true)
      toast.info("🔄 Comprimindo miniatura...")
      
      try {
        processedFile = await compressImage(file, 800, 0.8)
        const compressedSize = (processedFile.size / 1024).toFixed(1)
        toast.success(`✅ Miniatura comprimida: ${compressedSize}KB (${((1 - processedFile.size / file.size) * 100).toFixed(1)}% menor)`)
      } catch (error) {
        toast.warning("⚠️ Erro na compressão, usando arquivo original")
        processedFile = file
      }
      
      setIsCompressing(false)
    }

    setSelectedThumbFile(processedFile)

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setThumbPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(processedFile)
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
    // Usar a data local sem ajustes de timezone
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
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

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId)
    const stateCities = cities.filter(city => city.stateId === stateId && city.stateId !== null)
    setFilteredCities(stateCities)
    
    // Limpar seleção de cidade quando mudar estado
    const citySelect = document.getElementById('cityId') as HTMLSelectElement
    if (citySelect) {
      citySelect.value = ''
    }
  }

  // Função para comprimir imagem
  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      // Verificar se estamos no cliente
      if (typeof window === 'undefined') {
        resolve(file)
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = document.createElement('img')
      
      img.onload = () => {
        // Mostrar dimensões originais
        toast.info(`📐 Dimensões originais: ${img.width}x${img.height}px`)
        
        // Calcular novo tamanho mantendo proporção
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // Desenhar e comprimir
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            
            // Mostrar dimensões finais se diferentes
            if (img.width !== width || img.height !== height) {
              toast.info(`🎯 Dimensões ajustadas: ${width}x${height}px`)
            }
            
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, file.type, quality)
      }
      
      img.onerror = () => {
        toast.error("❌ Erro ao processar imagem")
        resolve(file)
      }
      
      img.src = URL.createObjectURL(file)
    })
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
                readOnly
                className="bg-gray-50 cursor-not-allowed"
                required
              />
              <FieldError actionState={actionState} name="slug" />
              <p className="text-xs text-muted-foreground">
                Gerado automaticamente baseado no título do evento.
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
              <Select name="format" defaultValue={event?.format} onValueChange={setSelectedFormat}>
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

            {/* Campos de Endereço - ocultos para eventos online */}
            {selectedFormat !== 'ONLINE' && <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">Endereço do Evento</h4>
                <div className="flex items-center gap-2">
                  <Label htmlFor="is_international" className="text-sm">Evento Internacional</Label>
                  <Switch
                    id="is_international"
                    name="is_international"
                    checked={isInternational}
                    onCheckedChange={setIsInternational}
                  />
                </div>
              </div>

              {/* Campo hidden para enviar o valor do switch */}
              <input type="hidden" name="is_international_value" value={isInternational ? "true" : "false"} />

              {isInternational ? (
                // Campos para evento internacional
                <>
                  <div className="space-y-2">
                    <Label htmlFor="location_name">Nome do Local *</Label>
                    <Input
                      id="location_name"
                      name="location_name"
                      placeholder="Ex: Miami Beach Convention Center"
                      defaultValue={event?.location_name}
                      required={isInternational}
                    />
                    <FieldError actionState={actionState} name="location_name" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_address">Endereço Completo *</Label>
                    <Input
                      id="location_address"
                      name="location_address"
                      placeholder="Ex: 1901 Convention Center Dr"
                      defaultValue={event?.location_address}
                      required={isInternational}
                    />
                    <FieldError actionState={actionState} name="location_address" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location_city">Cidade *</Label>
                      <Input
                        id="location_city"
                        name="location_city"
                        placeholder="Ex: Miami Beach"
                        defaultValue={event?.location_city}
                        required={isInternational}
                      />
                      <FieldError actionState={actionState} name="location_city" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location_state">Estado/Província</Label>
                      <Input
                        id="location_state"
                        name="location_state"
                        placeholder="Ex: Florida"
                        defaultValue={event?.location_state}
                      />
                      <FieldError actionState={actionState} name="location_state" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_country">País *</Label>
                    <Input
                      id="location_country"
                      name="location_country"
                      placeholder="Ex: Estados Unidos"
                      defaultValue={event?.location_country}
                      required={isInternational}
                    />
                    <FieldError actionState={actionState} name="location_country" />
                  </div>
                </>
              ) : (
                // Campos para evento nacional (Brasil)
                <>
                  {/* Rua */}
                  <div className="space-y-2">
                    <Label htmlFor="street">Rua/Logradouro *</Label>
                    <Input
                      id="street"
                      name="street"
                      placeholder="Ex: Rua das Flores"
                      defaultValue={event?.address?.street}
                      required={!isInternational}
                    />
                    <FieldError actionState={actionState} name="street" />
                  </div>

                  {/* Número e Complemento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        name="number"
                        placeholder="Ex: 123"
                        defaultValue={event?.address?.number}
                        required={!isInternational}
                      />
                      <FieldError actionState={actionState} name="number" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        name="complement"
                        placeholder="Ex: Sala 101, Andar 2"
                        defaultValue={event?.address?.complement}
                      />
                      <FieldError actionState={actionState} name="complement" />
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="space-y-2">
                    <Label htmlFor="stateId">Estado *</Label>
                    <Select
                      name="stateId"
                      defaultValue={event?.address?.stateId}
                      onValueChange={handleStateChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map(state => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name} ({state.uf})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError actionState={actionState} name="stateId" />
                  </div>

                  {/* Cidade */}
                  <div className="space-y-2">
                    <Label htmlFor="cityId">Cidade *</Label>
                    <Select
                      name="cityId"
                      defaultValue={event?.address?.cityId}
                      disabled={!selectedState}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedState ? "Selecione a cidade" : "Selecione o estado primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCities.map(city => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError actionState={actionState} name="cityId" />
                  </div>

                  {/* CEP */}
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">CEP *</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      placeholder="Ex: 12345-678"
                      defaultValue={event?.address?.postal_code}
                      required={!isInternational}
                    />
                    <FieldError actionState={actionState} name="postal_code" />
                  </div>
                </>
              )}
            </div>}
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
            {selectedFormat === 'ONLINE' ? (
              <>
                {/* Evento online: vagas ilimitadas, enviar valores padrão */}
                <input type="hidden" name="vacancy_total" value="0" />
                <input type="hidden" name="vacancy_online" value="0" />
                <input type="hidden" name="vacancies_per_brand" value="0" />
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Evento online — vagas ilimitadas. Não é necessário configurar limites de vagas.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vacancy_total">Total de Vagas Presenciais *</Label>
                    <Input
                      id="vacancy_total"
                      name="vacancy_total"
                      type="number"
                      min="1"
                      defaultValue={event?.vacancy_total}
                      required
                    />
                    <FieldError actionState={actionState} name="vacancy_total" />
                    <p className="text-xs text-muted-foreground">
                      Quantidade de vagas para inscrições presenciais
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vacancy_online">Total de Vagas Online</Label>
                    <Input
                      id="vacancy_online"
                      name="vacancy_online"
                      type="number"
                      min="0"
                      defaultValue={event?.vacancy_online || 0}
                    />
                    <FieldError actionState={actionState} name="vacancy_online" />
                    <p className="text-xs text-muted-foreground">
                      Quantidade de vagas para inscrições online (0 = sem vagas online)
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">Controle por Marca</h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="free_online">Liberar vagas online ilimitadas para marcas</Label>
                      <p className="text-xs text-muted-foreground">
                        Inscrições online não consomem vagas da marca, mas respeitam o limite total de vagas online
                      </p>
                    </div>
                    <Switch
                      id="free_online"
                      name="free_online"
                      checked={freeOnline}
                      onCheckedChange={setFreeOnline}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vacancies_per_brand" className={freeOnline ? "text-muted-foreground" : ""}>
                        Vagas por Marca
                      </Label>
                      <Input
                        id="vacancies_per_brand"
                        name="vacancies_per_brand"
                        type="number"
                        min="0"
                        defaultValue={event?.vacancies_per_brand}
                        disabled={freeOnline}
                        className={freeOnline ? "opacity-50" : ""}
                      />
                      <FieldError actionState={actionState} name="vacancies_per_brand" />
                      <p className="text-xs text-muted-foreground">
                        {freeOnline
                          ? "Desativado — vagas online ilimitadas ativas"
                          : "Limite de vagas por marca (0 = sem limite)"
                        }
                      </p>
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
                </div>
              </>
            )}
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
                <Label htmlFor="schedule_link">Link da Agenda</Label>
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
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Imagem Principal</h4>
                {selectedFile && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                    {(selectedFile.size / 1024).toFixed(1)}KB
                  </span>
                )}
              </div>
              
              {/* Preview da imagem principal */}
              <div className={`relative aspect-video w-full max-w-md rounded-lg overflow-hidden border-2 border-dashed transition-all duration-200 ${
                previewUrl ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 bg-muted hover:border-primary/50'
              }`}>
                {isCompressing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <div className="text-white text-center">
                      <LucideLoaderCircle className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Processando...</p>
                    </div>
                  </div>
                )}
                {previewUrl ? (
                  <div className="relative h-full">
                    <Image
                      src={previewUrl}
                      alt="Preview da imagem principal do evento"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200" />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground opacity-30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, GIF ou WEBP</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload da imagem principal */}
              <div className="space-y-2">
                <Label htmlFor="image_file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Imagem Principal
                  {selectedFile && <span className="text-green-600">✓</span>}
                </Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    id="image_file"
                    name="image_file"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    className="flex-1"
                    disabled={isCompressing}
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={isCompressing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FieldError actionState={actionState} name="image_file" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: JPG, PNG, GIF, WEBP. Tamanho máximo: 5MB.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                      📐 Resolução recomendada:
                    </p>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Resolução recomendada:</strong> 1200x480px</li>
                      <li>• <strong>Evento destaque:</strong> 1200x480px (formato paisagem)</li>
                      <li>• <strong>Tamanho máximo:</strong> 5MB</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Miniatura */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-secondary-foreground" />
                <h4 className="font-semibold">Miniatura (Carrossel)</h4>
                {selectedThumbFile && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
                    {(selectedThumbFile.size / 1024).toFixed(1)}KB
                  </span>
                )}
              </div>
              
              {/* Preview da miniatura */}
              <div className={`relative aspect-video w-full max-w-sm rounded-lg overflow-hidden border-2 border-dashed transition-all duration-200 ${
                thumbPreviewUrl ? 'border-secondary bg-secondary/5' : 'border-muted-foreground/25 bg-muted hover:border-secondary/50'
              }`}>
                {isCompressing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <div className="text-white text-center">
                      <LucideLoaderCircle className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-xs">Processando...</p>
                    </div>
                  </div>
                )}
                {thumbPreviewUrl ? (
                  <div className="relative h-full">
                    <Image
                      src={thumbPreviewUrl}
                      alt="Preview da miniatura do evento"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200" />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground opacity-30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                      <p className="text-xs text-muted-foreground">Para listagens</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload da miniatura */}
              <div className="space-y-2">
                <Label htmlFor="thumb_file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Miniatura
                  {selectedThumbFile && <span className="text-green-600">✓</span>}
                </Label>
                <div className="flex gap-2">
                  <Input
                    ref={thumbFileInputRef}
                    id="thumb_file"
                    name="thumb_file"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleThumbSelect}
                    className="flex-1"
                    disabled={isCompressing}
                  />
                  {selectedThumbFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveThumb}
                      disabled={isCompressing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FieldError actionState={actionState} name="thumb_file" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: JPG, PNG, GIF, WEBP. Tamanho máximo: 5MB.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                      📐 Resolução recomendada:
                    </p>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Resolução recomendada:</strong> 400x320px</li>
                      <li>• <strong>Cards de eventos:</strong> 400x320px (formato levemente paisagem)</li>
                      <li>• <strong>Tamanho máximo:</strong> 5MB</li>
                    </ul>
                  </div>
                </div>
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

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="exclusive_for_members">Exclusivo para associados</Label>
                <p className="text-sm text-muted-foreground">
                  Restringir inscrições apenas para empresas com associação ativa na ABF
                </p>
              </div>
              <Switch
                id="exclusive_for_members"
                name="exclusive_for_members"
                defaultChecked={event?.exclusive_for_members}
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
            disabled={pending || isCompressing}
            className="flex-1 md:flex-none"
          >
            {pending || isCompressing ? (
              <LucideLoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isCompressing ? 'Comprimindo...' : pending ? 'Salvando...' : event ? 'Atualizar Evento' : 'Criar Evento'}
          </Button>
        </div>
      </div>
    </Form>
  )
}