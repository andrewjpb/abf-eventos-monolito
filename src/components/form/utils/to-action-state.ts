import { ZodError } from "zod"


export type ActionState<T = unknown> = {
  status?: "SUCCESS" | "ERROR",
  message: string,
  payload?: FormData,
  fieldErrors: Record<string, string[] | undefined>,
  timestamp: number,
  data?: T
}

export const EMPTY_ACTION_STATE: ActionState = {
  message: "",
  fieldErrors: {},
  timestamp: Date.now()
}

export const fromErrorToActionState = (
  error: unknown,
  formData?: FormData,
): ActionState => {


  if (error instanceof ZodError) {
    return {
      message: error.errors[0].message,
      fieldErrors: error.flatten().fieldErrors,
      payload: formData,
      timestamp: Date.now()
    }
  } else if (error instanceof Error) {

    return {
      message: error.message,
      fieldErrors: {},
      status: "ERROR",
      payload: formData,
      timestamp: Date.now()
    }
  } else {
    return {
      message: "An unknown error occurred",
      fieldErrors: {},
      payload: formData,
      timestamp: Date.now()
    }
  }
}


export const toActionState = <T>(
  status: ActionState["status"],
  message: string,
  formData?: FormData,
  data?: T | unknown

): ActionState<T> => {

  return {
    status,
    message,
    fieldErrors: {},
    payload: formData,
    timestamp: Date.now(),
    data: data as T
  }
}