import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * shadcn Select. `options` is `[{ value, label }]`; values must be non-empty strings or numbers.
 * Radix works in strings, so `onValueChange` receives the option's original value.
 */
export function SelectField({ label, value, onValueChange, options }) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onValueChange(options.find((o) => String(o.value) === v)?.value ?? v)}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={String(o.value)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
