import { Button as BaseButton } from '@base-ui/react/button'
import { Hint } from './hint'
import { cx } from './utils'

/** Base UI button. Icon-only buttons (`icon` + `aria-label`) get a tooltip with the same text. */
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
  const button = (
    <BaseButton
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
      className={cx(
        'btn',
        variant !== 'default' && `btn-${variant}`,
        size === 'sm' && 'btn-sm',
        icon && 'btn-icon',
        className,
      )}
      {...props}
    >
      {loading && <span className="spinner" aria-hidden />}
      {children}
    </BaseButton>
  )
  return icon && props['aria-label'] ? <Hint label={props['aria-label']}>{button}</Hint> : button
}
