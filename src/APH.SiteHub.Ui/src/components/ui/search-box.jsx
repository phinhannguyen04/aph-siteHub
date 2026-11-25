import { Input as BaseInput } from '@base-ui/react/input'
import { Search } from 'lucide-react'

export function SearchBox({ label, value, onChange }) {
  return (
    <div className="search">
      <Search size={14} aria-hidden />
      <BaseInput
        type="search"
        className="input"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
