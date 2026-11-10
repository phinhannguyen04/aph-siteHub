'use client'
import { X } from 'lucide-react'
import { type FormEvent, type ReactNode, useEffect, useId, useRef } from 'react'
import { c } from '@/lib/copy'
import { cx } from '@/lib/cx'

const sizes = { xs: 'sm:max-w-md', sm: 'sm:max-w-xl', md: 'sm:max-w-2xl' }

/** daisyUI modal on a native <dialog>: focus trapping, Escape and top-layer stacking come free. */
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
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])
  const body = (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 id={id} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {closeButton && (
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square -me-2 -mt-1"
            aria-label={c.close}
            onClick={() => onClose?.()}
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
      {actions && <div className="modal-action mt-6">{actions}</div>}
    </>
  )
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={cx('modal', placement === 'end' ? 'modal-end' : 'modal-bottom sm:modal-middle')}
      onCancel={(e) => {
        e.preventDefault()
        onClose?.()
      }}
    >
      <div
        className={cx(
          'modal-box border border-base-300',
          placement === 'end'
            ? 'h-full max-h-none w-full max-w-none rounded-none sm:w-[440px]'
            : cx('w-full', sizes[size]),
        )}
      >
        {onSubmit ? (
          <form noValidate onSubmit={onSubmit}>
            {body}
          </form>
        ) : (
          body
        )}
      </div>
      <div className="modal-backdrop bg-black/40" aria-hidden onClick={() => onClose?.()} />
    </dialog>
  )
}
