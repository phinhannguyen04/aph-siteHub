import { cx } from '@/lib/cx'

const tones = {
  primary: '[&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary',
  info: '[&::-webkit-progress-value]:bg-info [&::-moz-progress-bar]:bg-info',
  success: '[&::-webkit-progress-value]:bg-success [&::-moz-progress-bar]:bg-success',
  warning: '[&::-webkit-progress-value]:bg-warning [&::-moz-progress-bar]:bg-warning',
  error: '[&::-webkit-progress-value]:bg-error [&::-moz-progress-bar]:bg-error',
}

/** Native <progress> so assistive technology gets the value; omit `value` for an indeterminate bar. */
export function Progress({
  value,
  max = 100,
  tone = 'primary',
  label,
  className,
}: {
  value?: number
  max?: number
  tone?: keyof typeof tones
  label: string
  className?: string
}) {
  return (
    <progress
      value={value}
      max={max}
      aria-label={label}
      className={cx(
        'block h-1.5 w-full appearance-none overflow-hidden rounded-full bg-base-content/15',
        '[&::-webkit-progress-bar]:bg-base-content/15 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:rounded-full',
        'indeterminate:animate-pulse indeterminate:bg-primary/40',
        tones[tone],
        className,
      )}
    />
  )
}
