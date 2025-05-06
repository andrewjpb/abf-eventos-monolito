import { useEffect, useRef } from "react"
import { ActionState } from "../utils/to-action-state"

type OnArgs = {
  actionState: ActionState
}

type UseActionFeefbackOptions = {
  onSucess?: (onArgs: OnArgs) => void
  onError?: (onArgs: OnArgs) => void
}

const useActionFeedback = (
  actionState: ActionState,
  options: UseActionFeefbackOptions
) => {

  const prevTimeoutRef = useRef(actionState.timestamp)
  const IsUpdate = actionState.timestamp !== prevTimeoutRef.current

  useEffect(() => {
    if (!IsUpdate) return
    if (actionState.status === "SUCCESS") {
      options.onSucess?.({ actionState })
    } else if (actionState.status === "ERROR") {
      options.onError?.({ actionState })
    }

    prevTimeoutRef.current = actionState.timestamp
  }, [IsUpdate, actionState, options])
}

export { useActionFeedback }
