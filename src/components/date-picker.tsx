"use client"

import * as React from "react"
import { format } from "date-fns"
import { LucideCalendar } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"

type DatePickerProps = {
  id: string
  name: string
  defaultValue?: string | undefined
}

const DatePicker = ({ id, name, defaultValue }: DatePickerProps) => {
  const [date, setDate] = useState<Date | undefined>(
    defaultValue ? new Date(defaultValue) : new Date()
  )

  const [open, setOpen] = useState(false)

  const formatttedString = date ? format(date, "yyyy-MM-dd") : "Pick a date"

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger id={id} name={name} asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <LucideCalendar className="mr-2 h-4 w-4" />
          {formatttedString}
          <input type="hidden" id={id} name={name} value={formatttedString} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
