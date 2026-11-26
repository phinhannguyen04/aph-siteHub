import { Button as ShadcnButton } from '@/components/ui/button'
import { Hint } from './hint'

// App-level variant names → shadcn variants.
const variants = { default: 'outline', primary: 'default', danger: 'destructive', ghost: 'ghost' }

/** shadcn Button. Icon-only buttons (`icon` + `aria-label`) get a tooltip with the same text. */
export function Button({
  variant = 'default',
  size,
  icon = false,
  loading = false,
  className,
  children,
  disabled,
  ...props
}) {
  const small = size === 'sm'
  const button = (
    <ShadcnButton
      disabled={disabled || loading}
      variant={variants[variant] ?? variant}
      size={icon ? (small ? 'icon-sm' : 'icon') : small ? 'sm' : 'default'}
      className={className}
      {...props}
    >
      {loading && <span className="spinner" aria-hidden />}
      {children}
    </ShadcnButton>
  )
  return icon && props['aria-label'] ? <Hint label={props['aria-label']}>{button}</Hint> : button
}
