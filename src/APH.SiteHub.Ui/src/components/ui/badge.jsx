import { cx } from './utils'

export function Badge({ tone, children }) {
  return <span className={cx('badge', tone)}>{children}</span>
}
