// /features/events/admin/components/event-schedule-manager.tsx
"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Clock, 
  Calendar,
  Edit,
  Trash2,
  Save,
  X
} from "lucide-react"
import { EventSchedule, formatarHorario, ordenarProgramacao } from "../../types"
import { addScheduleItem, removeScheduleItem, updateScheduleItem } from "../actions/manage-event-schedule"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface EventScheduleManagerProps {
  eventId: string
  eventDate: Date
  schedule: EventSchedule[]
}

export function EventScheduleManager({ 
  eventId, 
  eventDate, 
  schedule 
}: EventScheduleManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<EventSchedule>>({})

  // Ordenar programação
  const sortedSchedule = ordenarProgramacao(schedule)

  // Resetar formulário
  const resetForms = () => {
    setShowAddForm(false)
    setEditingItem(null)
    setEditFormData({})
  }

  // Adicionar item
  const handleAddItem = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await addScheduleItem(EMPTY_ACTION_STATE, formData)
        
        if (result.status === "SUCCESS") {
          toast.success("Item adicionado com sucesso!")
          resetForms()
        } else {
          toast.error(result.message || "Erro ao adicionar item")
        }
      } catch (error) {
        toast.error("Erro interno do servidor")
      }
    })
  }

  // Remover item
  const handleRemoveItem = async (scheduleId: string) => {
    if (!confirm("Deseja realmente remover este item da programação?")) return

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("scheduleId", scheduleId)
        formData.append("eventId", eventId)

        const result = await removeScheduleItem(EMPTY_ACTION_STATE, formData)
        
        if (result.status === "SUCCESS") {
          toast.success("Item removido com sucesso!")
        } else {
          toast.error(result.message || "Erro ao remover item")
        }
      } catch (error) {
        toast.error("Erro interno do servidor")
      }
    })
  }

  // Iniciar edição
  const startEdit = (item: EventSchedule) => {
    setEditingItem(item.id)
    setEditFormData({
      day_date: item.day_date,
      start_time: item.start_time,
      end_time: item.end_time,
      title: item.title,
      description: item.description,
      order_index: item.order_index
    })
  }

  // Salvar edição
  const handleEditItem = async (scheduleId: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("scheduleId", scheduleId)
        formData.append("eventId", eventId)
        formData.append("day_date", new Date(editFormData.day_date!).toISOString().split('T')[0])
        formData.append("start_time", editFormData.start_time!)
        formData.append("end_time", editFormData.end_time!)
        formData.append("title", editFormData.title!)
        formData.append("description", editFormData.description || "")
        formData.append("order_index", editFormData.order_index?.toString() || "0")

        const result = await updateScheduleItem(EMPTY_ACTION_STATE, formData)
        
        if (result.status === "SUCCESS") {
          toast.success("Item atualizado com sucesso!")
          resetForms()
        } else {
          toast.error(result.message || "Erro ao atualizar item")
        }
      } catch (error) {
        toast.error("Erro interno do servidor")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Programação do Evento
          </CardTitle>
          <Button
            onClick={() => setShowAddForm(true)}
            disabled={isPending || showAddForm}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Formulário de adicionar */}
        {showAddForm && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <form action={handleAddItem} className="space-y-4">
                <input type="hidden" name="eventId" value={eventId} />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="day_date">Data</Label>
                    <Input
                      id="day_date"
                      name="day_date"
                      type="date"
                      defaultValue={eventDate.toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="start_time">Horário Início</Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="time"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">Horário Fim</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="time"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Ex: Abertura, Palestra, Coffee Break..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descrição detalhada da atividade..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="order_index">Ordem (opcional)</Label>
                  <Input
                    id="order_index"
                    name="order_index"
                    type="number"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isPending} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista da programação */}
        {sortedSchedule.length > 0 ? (
          <div className="space-y-3">
            {sortedSchedule.map((item) => (
              <Card key={item.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  {editingItem === item.id ? (
                    // Formulário de edição
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Data</Label>
                          <Input
                            type="date"
                            value={new Date(editFormData.day_date!).toISOString().split('T')[0]}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              day_date: new Date(e.target.value)
                            })}
                          />
                        </div>
                        
                        <div>
                          <Label>Início</Label>
                          <Input
                            type="time"
                            value={editFormData.start_time}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              start_time: e.target.value
                            })}
                          />
                        </div>
                        
                        <div>
                          <Label>Fim</Label>
                          <Input
                            type="time"
                            value={editFormData.end_time}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              end_time: e.target.value
                            })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Título</Label>
                        <Input
                          value={editFormData.title}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            title: e.target.value
                          })}
                        />
                      </div>

                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={editFormData.description || ""}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            description: e.target.value
                          })}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditItem(item.id)}
                          disabled={isPending}
                          size="sm"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => resetForms()}
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Visualização normal
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="bg-blue-50">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatarHorario(item.start_time)} - {formatarHorario(item.end_time)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(item.day_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {item.title}
                        </h4>
                        
                        {item.description && (
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(item)}
                          disabled={isPending}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum item na programação.</p>
            <p className="text-sm">Clique em "Adicionar Item" para começar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}