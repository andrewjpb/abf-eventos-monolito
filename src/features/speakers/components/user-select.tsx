// /features/speakers/components/user-select.tsx
"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, User, Building, X, Search, LucideLoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserWithCompany } from "../types"
import Image from "next/image"
import { searchUsers } from "../queries/search-users"
import { useDebounce } from "@/hooks/use-debounce"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UserSelectProps {
  selectedUserId: string
  onChange: (userId: string) => void
  excludeSpeakerId?: string
}

export function UserSelect({ selectedUserId, onChange, excludeSpeakerId }: UserSelectProps) {
  const [open, setOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithCompany | null>(null)
  const [userOptions, setUserOptions] = useState<UserWithCompany[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [totalUsersCount, setTotalUsersCount] = useState(0)

  // Debounce da busca para evitar muitas requisições
  const debouncedSearch = useDebounce(userSearch, 300)

  // Efeito para buscar o usuário selecionado quando o componente monta
  useEffect(() => {
    const fetchSelectedUser = async () => {
      if (selectedUserId) {
        setIsLoadingUsers(true)
        try {
          // Buscar apenas o usuário selecionado pelo ID específico
          const result = await searchUsers({
            userId: selectedUserId, // Buscar por ID específico
          });

          if (result.users.length > 0) {
            setSelectedUser(result.users[0] as UserWithCompany);
          }
        } catch (error) {
          console.error("Erro ao buscar usuário selecionado:", error);
        } finally {
          setIsLoadingUsers(false);
        }
      }
    };

    if (selectedUserId) {
      fetchSelectedUser();
    }
  }, [selectedUserId]);

  // Função para carregar usuários com base no termo de busca
  const loadUsers = async (search: string = "") => {
    if (!open) return; // Não buscar se o popover não estiver aberto

    setIsLoadingUsers(true);
    try {
      console.log("Buscando usuários com termo:", search);
      const result = await searchUsers({
        search,
        limit: 20
      });

      console.log("Usuários encontrados:", result.users.length);
      setUserOptions(result.users as UserWithCompany[]);
      setTotalUsersCount(result.metadata.total);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Efeito para buscar quando o termo de pesquisa mudar (com debounce)
  useEffect(() => {
    if (open) {
      loadUsers(debouncedSearch);
    }
  }, [debouncedSearch, open]);

  // Quando o select é aberto, carregar opções iniciais
  useEffect(() => {
    if (open) {
      loadUsers("");
    }
  }, [open]);

  // Limpar o campo de pesquisa
  const handleClearSearch = () => {
    setUserSearch("");
  };

  // Função para destacar texto correspondente à busca
  const highlightMatch = (text: string, query: string) => {
    if (!query || query.trim() === "") return text;

    try {
      const regex = new RegExp(`(${query.trim()})`, 'gi');
      const parts = text.split(regex);

      return parts.map((part, i) =>
        regex.test(part) ? <span key={i} className="bg-yellow-100 dark:bg-yellow-800">{part}</span> : part
      );
    } catch (e) {
      // Se houver algum erro na regex (caracteres especiais), retornar texto normal
      return text;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="user-select">Selecione o Usuário</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            id="user-select"
          >
            {selectedUser ? (
              <div className="flex items-center">
                {selectedUser.image_url ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                    <Image
                      src={selectedUser.image_url}
                      alt={selectedUser.name}
                      width={24}
                      height={24}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <User className="mr-2 h-4 w-4" />
                )}
                <span>
                  {selectedUser.name}
                  {selectedUser.position && ` (${selectedUser.position})`}
                </span>
              </div>
            ) : (
              "Selecione um usuário..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px] lg:w-[400px]">
          <div className="flex flex-col h-[350px]">
            {/* Cabeçalho de busca - fixo no topo */}
            <div className="px-3 py-2 bg-background border-b">
              <div className="relative">
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pr-8"
                  autoFocus
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSearch();
                    }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {isLoadingUsers ? (
                    <LucideLoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Search className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Conteúdo principal - com rolagem */}
            <div className="flex-1 overflow-hidden">
              {isLoadingUsers ? (
                <div className="h-full flex flex-col justify-center items-center py-6">
                  <LucideLoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Buscando usuários...</p>
                </div>
              ) : userOptions.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center py-6">
                  <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-1">
                    {userOptions.map((user) => (
                      <div
                        key={user.id}
                        className={cn(
                          "flex items-center w-full p-2 rounded-md cursor-pointer",
                          selectedUserId === user.id ? "bg-primary/10" : "hover:bg-muted"
                        )}
                        onClick={() => {
                          onChange(user.id);
                          setSelectedUser(user);
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-center w-full">
                          {user.image_url ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0">
                              <Image
                                src={user.image_url}
                                alt={user.name}
                                width={24}
                                height={24}
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <User className="mr-2 h-4 w-4 flex-shrink-0" />
                          )}
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="truncate font-medium">
                              {highlightMatch(user.name, userSearch)}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {highlightMatch(user.email, userSearch)}
                            </span>
                          </div>
                          {user.company && (
                            <div className="flex items-center ml-2 text-xs text-muted-foreground">
                              <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">{user.company.name}</span>
                            </div>
                          )}
                          {selectedUserId === user.id && (
                            <Check className="ml-2 h-4 w-4 flex-shrink-0 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Rodapé com contagem - fixo na base */}
            {userOptions.length > 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t bg-background">
                {totalUsersCount > userOptions.length
                  ? `Mostrando ${userOptions.length} de ${totalUsersCount} usuários`
                  : `Total: ${userOptions.length} usuários`}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}