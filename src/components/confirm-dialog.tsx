"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Form } from "./form/form"
import { SubmitButton } from "./form/submit-button"
import { cloneElement, useActionState, useState } from "react"
import { EMPTY_ACTION_STATE, ActionState } from "./form/utils/to-action-state"

type ConfirmDialogProps = {
  title: string
  action: () => Promise<ActionState>
  trigger: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>
  description?: string
  onSuccess?: (actionState: ActionState) => void
}

const useConfirmDialog = ({
  action,
  trigger,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This will permanently delete the item.",
  onSuccess
}: ConfirmDialogProps) => {


  const [isOpen, setIsOpen] = useState(false)

  const dialogTrigger = cloneElement(trigger, {
    onClick: () => setIsOpen(state => !state)
  })

  const [actionState, formAction] = useActionState(action, EMPTY_ACTION_STATE);


  const handleSuccess = () => {
    setIsOpen(false)
    onSuccess?.(actionState)
  }

  const dialog = (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Form action={formAction} actionState={actionState} onSuccess={handleSuccess} >
              <SubmitButton label="Confirm" />
            </Form>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return [dialogTrigger, dialog]
}

// Componente ConfirmDialog para uso direto
type ConfirmDialogComponentProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  variant?: "default" | "destructive"
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  variant = "default"
}: ConfirmDialogComponentProps) => {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription asChild>
              <div>{description}</div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { useConfirmDialog }
