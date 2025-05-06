
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"



export type SortSelectOptions = {
  sortKey: string
  sortValue: string
  label: string
}

type SortObject = {
  sortKey: string
  sortValue: string
}

type SortSelectProps = {
  options: SortSelectOptions[]
  onChange: (sort: SortObject) => void
  value: SortObject
}



const SortSelect = ({ options, onChange, value }: SortSelectProps) => {
  const handleSort = (compositeValue: string) => {
    const [sortKey, sortValue] = compositeValue.split("_")

    onChange({
      sortKey,
      sortValue
    })
  }

  return (
    <Select
      onValueChange={handleSort}
      defaultValue={value.sortKey + "_" + value.sortValue}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.sortKey + option.sortValue} value={option.sortKey + "_" + option.sortValue}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { SortSelect }
