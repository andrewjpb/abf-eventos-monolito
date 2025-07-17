import { toast } from "sonner"
import { useActionFeedback } from "./hooks/use-action-feedback"
import { ActionState } from "./utils/to-action-state"
import { useEffect, useRef } from "react"

type FormProps = {
  action: (payload: FormData) => void,
  actionState: ActionState,
  children: React.ReactNode,
  onSuccess?: (actionState: ActionState) => void,
  onError?: (actionState: ActionState) => void,
}

const Form = ({ action, children, actionState, onSuccess, onError }: FormProps) => {
  const formRef = useRef<HTMLFormElement>(null)

  useActionFeedback(actionState, {
    onSucess: ({ actionState }) => {
      if (actionState.message) {
        toast.success(actionState.message)
      }
      onSuccess?.(actionState)
    },
    onError: ({ actionState }) => {
      if (actionState.message) {
        toast.error(actionState.message)
      }
      onError?.(actionState)
    }
  })

  // Restaurar valores do formulário a partir do payload quando houver erro
  useEffect(() => {
    if (actionState.payload && formRef.current) {
      const formData = actionState.payload
      const form = formRef.current
      
      // Iterar sobre todos os campos do FormData e restaurar valores
      for (const [key, value] of formData.entries()) {
        const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        if (input) {
          if (input.type === 'checkbox') {
            (input as HTMLInputElement).checked = value === 'true' || value === 'on'
          } else if (input.type === 'radio') {
            (input as HTMLInputElement).checked = input.value === value
          } else {
            input.value = value as string
          }
        }
      }
    }
  }, [actionState.payload, actionState.timestamp])

  return <form ref={formRef} action={action} className="flex flex-col gap-y-2">
    {children}
  </form>

}

export { Form }
