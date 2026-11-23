import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { c } from '@/lib/copy'
import { cx } from '@/lib/cx'
import { Button } from './button'

const sizes = { xs: 'sm:max-w-md', sm: 'sm:max-w-xl', md: 'sm:max-w-2xl' }
const noop = () => {}

/** Headless UI dialog: focus trap, Escape, outside click, scroll lock and stacking come from the library. */
export function Modal({
  title,
  onClose,
  children,
  actions,
  onSubmit,
  size = 'sm',
  placement = 'center',
  closeButton = false,
}: {
  title: ReactNode
  /** Omit while a request is pending to lock the dialog open. */
  onClose?: () => void
  children: ReactNode
  actions?: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  size?: keyof typeof sizes
  placement?: 'center' | 'end'
  closeButton?: boolean
}) {
  const body = (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <DialogTitle as="h2" className="text-lg font-semibold tracking-tight">
          {title}
        </DialogTitle>
        {closeButton && (
          <Button
            variant="ghost"
            size="sm"
            square
            className="-me-2 -mt-1"
            aria-label={c.close}
            onClick={() => onClose?.()}
          >
            <X size={18} />
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
      {actions && <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div>}
    </>
  )
  return (
    <Dialog open onClose={onClose ?? noop} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 animate-fade-in bg-black/40" />
      <div
        className={cx(
          'fixed inset-0 flex',
          placement === 'end' ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-4',
        )}
      >
        <DialogPanel
          className={cx(
            'overflow-y-auto border border-base-300 bg-base-100 p-6 shadow-xl',
            placement === 'end'
              ? 'h-full w-full animate-slide-in-end rounded-none sm:w-[440px]'
              : cx(
                  'max-h-[90dvh] w-full animate-sheet-in rounded-t-box sm:animate-pop-in sm:rounded-box',
                  sizes[size],
                ),
          )}
        >
          {onSubmit ? (
            <form noValidate onSubmit={onSubmit}>
              {body}
            </form>
          ) : (
            body
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
