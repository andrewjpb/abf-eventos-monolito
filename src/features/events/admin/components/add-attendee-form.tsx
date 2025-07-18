"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Search, UserPlus, User } from "lucide-react"
import { toast } from "sonner"
import { addAttendeeToEvent } from "../actions/add-attendee"
import { PARTICIPANT_TYPE_OPTIONS } from "@/features/attendance-list/constants/participant-types"
import { Badge } from "@/components/ui/badge"

type User = {
  id: string
  name: string
  email: string
  position: string
  company: {
    name: string
    cnpj: string
  }
}

type AddAttendeeFormProps = {
  eventId: string
  onSuccess?: () => void
}

export function AddAttendeeForm({ eventId, onSuccess }: AddAttendeeFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [participantType, setParticipantType] = useState("participant")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<User[]>([])

  const searchUsers = async (term: string) => {
    if (term.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(term)}`)
      if (response.ok) {
        const users = await response.json()
        setSearchResults(users)
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      toast.error("Erro ao buscar usuários")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setSelectedUser(null)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setSearchTerm(user.name)
    setSearchResults([])
  }

  const handleSubmit = () => {
    if (!selectedUser) {
      toast.error("Selecione um usuário")
      return
    }

    const formData = new FormData()
    formData.append("userId", selectedUser.id)
    formData.append("eventId", eventId)
    formData.append("participantType", participantType)

    startTransition(async () => {
      try {
        const result = await addAttendeeToEvent(null as any, formData)
        
        if (result.status === "SUCCESS") {
          toast.success(result.message)
          setIsOpen(false)
          setSelectedUser(null)
          setSearchTerm("")
          setParticipantType("participant")
          onSuccess?.()
        } else {
          toast.error(result.message || "Erro ao adicionar inscrito")
        }
      } catch (error) {
        toast.error("Erro ao adicionar inscrito")
      }
    })
  }

  const resetForm = () => {
    setSelectedUser(null)
    setSearchTerm("")
    setParticipantType("participant")
    setSearchResults([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar Participante
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Participante ao Evento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busca de Usuário */}
          <div className="space-y-2">
            <Label htmlFor="userSearch">Buscar Usuário</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="userSearch"
                placeholder="Digite nome, email ou empresa..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
              
              {/* Resultados da busca */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email} • {user.company.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </div>
              )}
            </div>
          </div>

          {/* Usuário Selecionado */}
          {selectedUser && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {selectedUser.position}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedUser.company.name}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tipo de Participante */}
          <div className="space-y-2">
            <Label htmlFor="participantType">Tipo de Participante</Label>
            <Select value={participantType} onValueChange={setParticipantType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {PARTICIPANT_TYPE_OPTIONS.filter(option => option.value !== "speaker").map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedUser || isPending}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Adicionando...
                </div>
              ) : (
                "Adicionar Participante"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}