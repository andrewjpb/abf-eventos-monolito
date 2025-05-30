import { Ticket } from "lucide-react";
import { cloneElement } from "react";

type PlaceholderProps = {
  label: string;
  icon?: React.ReactElement<{ className?: string }>;
  button?: React.ReactElement<{ className?: string }>;
}

export function Placeholder({
  label,
  icon = <Ticket />,
  button = <div />
}: PlaceholderProps) {
  return (
    <div className="flex-1 self-center flex flex-col gap-y-2 items-center justify-center">
      {cloneElement(icon, {
        className: "w-16 h-16"
      })}
      <h2 className="text-lg text-center">{label}</h2>
      {cloneElement(button, {
        className: "h-10",
      })}
    </div>
  )
}
