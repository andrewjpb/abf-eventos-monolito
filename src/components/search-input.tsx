import { Input } from "./ui/input"
import { useDebouncedCallback } from "use-debounce"

type SearchInputProps = {
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

const SearchInput = ({ placeholder = "Search", value, onChange }: SearchInputProps) => {

  const handleSearch = useDebouncedCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value)
    }, 300)

  return <Input
    defaultValue={value}
    placeholder={placeholder}
    onChange={handleSearch}
  />
}

export { SearchInput }
