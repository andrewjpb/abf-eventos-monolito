// /features/speakers/components/speaker-upsert-form.tsx
"use client"

import { FieldError } from "@/components/form/field-error"
import { Form } from "@/components/form/form"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { Button } from "@/components/ui/button"
import { useActionState } from "react"
import { upsertSpeaker } from "../actions/upsert-speaker"
import { SpeakerWithEvents } from "../types"
import { useQueryClient } from "@tanstack/react-query"
import { LucideLoaderCircle, Save } from "lucide-react"
import clsx from "clsx"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { UserSelect } from "./user-select"
import { useState } from "react"

type SpeakerUpsertFormProps = {
  speaker?: SpeakerWithEvents
}

export function SpeakerUpsertForm({ speaker }: SpeakerUpsertFormProps) {
  const [actionState, action, pending] = useActionState(
    upsertSpeaker.bind(null, speaker?.id),
    EMPTY_ACTION_STATE
  )
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<string>(speaker?.moderatorId || "")



  return (
    <Form
      action={action}
      actionState={actionState}
      onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ["speakers"] })
      }}
    >
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações do Palestrante</h3>
        <Separator />

        <UserSelect
          selectedUserId={selectedUserId}
          onChange={(userId) => {
            setSelectedUserId(userId)
          }}
        />
        <input type="hidden" name="userId" value={selectedUserId} />
        <FieldError actionState={actionState} name="userId" />

        <div className="space-y-2">
          <Label htmlFor="description">Descrição/Bio</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Descrição do palestrante, biografia ou informações adicionais..."
            rows={4}
            defaultValue={speaker?.description || ""}
          />
          <FieldError actionState={actionState} name="description" />
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending || !selectedUserId}
        className="w-full mt-6"
      >
        {pending && (
          <LucideLoaderCircle className={clsx("w-4 h-4 mr-2 animate-spin")} />
        )}
        <Save className="mr-2 h-4 w-4" />
        {speaker ? "Atualizar Palestrante" : "Cadastrar Palestrante"}
      </Button>
    </Form>
  )
}