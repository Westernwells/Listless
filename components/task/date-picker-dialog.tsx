"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DatePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (date: Date) => void
  title: string
  initialDate?: Date
}

export function DatePickerDialog({ open, onOpenChange, onSelect, title, initialDate }: DatePickerDialogProps) {
  const [date, setDate] = React.useState<Date | undefined>(initialDate)

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
      onSelect(selectedDate)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[336px] p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            className="fixed-calendar"
            showOutsideDays
            fixedWeeks
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
