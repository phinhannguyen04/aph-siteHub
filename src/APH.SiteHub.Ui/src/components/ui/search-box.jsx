import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function SearchBox({ label, value, onChange }) {
  return (
    <div className="search">
      <Search size={14} aria-hidden />
      <Input
        type="search"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
