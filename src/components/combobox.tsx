// /components/combobox.tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: string
  disabled?: boolean
}

type ComboboxProps = {
  id: string
  name: string
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  createOption?: {
    enabled: boolean
    label: string
    onCreate: (value: string) => string
  }
}

export function Combobox({
  id,
  name,
  options,
  value,
  onChange,
  placeholder = "Selecione uma opção",
  emptyMessage = "Nenhuma opção encontrada",
  disabled = false,
  className,
  createOption,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  // Função para criar nova opção
  const handleCreateOption = () => {
    if (createOption?.enabled && searchTerm.trim()) {
      const newValue = createOption.onCreate(searchTerm.trim())
      if (newValue) {
        onChange(newValue)
        setOpen(false)
        setSearchTerm("")
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
          id={id}
          type="button"
        >
          {value && selectedOption
            ? selectedOption.label
            : placeholder}
          <input type="hidden" name={name} value={value} />
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {emptyMessage}
              {createOption?.enabled && searchTerm.trim() && (
                <Button
                  variant="ghost"
                  className="mt-2 w-full justify-start"
                  onClick={handleCreateOption}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {createOption.label}: "{searchTerm.trim()}"
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options
                .filter((option) =>
                  option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  option.value.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                      setSearchTerm("")
                    }}
                    disabled={option.disabled}
                    className={option.disabled ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
            </CommandGroup>
            {createOption?.enabled && searchTerm.trim() && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateOption}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {createOption.label}: "{searchTerm.trim()}"
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}