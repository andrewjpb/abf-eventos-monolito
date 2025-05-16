"use client"

import { useFormStatus } from "react-dom"
import { Button } from "../ui/button"
import { LucideLoaderCircle } from "lucide-react"
import { cloneElement } from "react"
import clsx from "clsx"


type SubmitButtonProps = {
  label: string
  icon?: React.ReactElement<{ className: string }>
  variant?: "default" | "outline" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

const SubmitButton = ({ label, icon, variant, size }: SubmitButtonProps) => {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} disabled={pending} size={size}>
      {pending && <LucideLoaderCircle className={clsx("w-4 h-4 mr-2 animate-spin cursor-pointer ", {
        "mr-2": !!label
      })} />}
      {pending ? null : icon ?
        <span className="ml-2">
          {cloneElement(icon, { className: "w-4 h-4" })}
        </span>
        : null}
      {label}

    </Button>)
}

export { SubmitButton }
