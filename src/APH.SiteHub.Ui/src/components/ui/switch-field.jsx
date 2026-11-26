import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function SwitchField({ label, checked, onChange }) {
  return (
    <Label className="w-fit cursor-pointer">
      <Switch checked={checked} onCheckedChange={onChange} />
      {label}
    </Label>
  )
}
