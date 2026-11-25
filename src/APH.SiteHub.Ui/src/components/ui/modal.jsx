import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { c } from '@/lib/copy'
import { Button } from './button'
import { cx } from './utils'

/**
 * Base UI Dialog. `variant="drawer"` slides in from the end edge. Nest child dialogs (for example a
 * quick "new tag" form) inside `children` so Base UI stacks them correctly. Pass no `onClose` to
 * make the dialog undismissable while a write is pending.
 */
export function Modal({ title, onClose, onSubmit, actions, children, variant }) {
  const content = (
    <>
      <div className="dialog-head">
        <Dialog.Title className="dialog-title">{title}</Dialog.Title>
        {onClose && (
          <Dialog.Close render={<Button variant="ghost" size="sm" icon aria-label={c.close} />}>
            <X size={16} />
          </Dialog.Close>
        )}
      </div>
      <div className="dialog-body">{children}</div>
      {actions && <div className="dialog-foot">{actions}</div>}
    </>
  )
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose?.()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="backdrop" />
        <Dialog.Viewport className={cx('viewport', variant)}>
          <Dialog.Popup className={cx('dialog', variant)}>
            {onSubmit ? (
              <form
                className="dialog-form"
                noValidate
                onSubmit={(e) => {
                  // Portalled child dialogs bubble React events through this form.
                  e.stopPropagation()
                  onSubmit(e)
                }}
              >
                {content}
              </form>
            ) : (
              <div className="dialog-form">{content}</div>
            )}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
