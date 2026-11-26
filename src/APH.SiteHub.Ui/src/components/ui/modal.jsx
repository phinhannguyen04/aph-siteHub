import { X } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { c } from '@/lib/copy'
import { Button } from './app-button'

/**
 * shadcn Dialog. `variant="wide"` widens it and `variant="drawer"` slides it in from the end edge.
 * Nest child dialogs (for example a quick "new tag" form) inside `children` so Radix stacks them
 * correctly. Pass no `onClose` to make the dialog undismissable while a write is pending.
 */
export function Modal({ title, onClose, onSubmit, actions, children, variant }) {
  const content = (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {onClose && (
          <DialogClose asChild>
            <Button variant="ghost" size="sm" icon aria-label={c.close}>
              <X size={16} />
            </Button>
          </DialogClose>
        )}
      </DialogHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">{children}</div>
      {actions && <DialogFooter>{actions}</DialogFooter>}
    </>
  )
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose?.()
      }}
    >
      <DialogContent variant={variant}>
        {onSubmit ? (
          <form
            className="flex min-h-0 flex-1 flex-col"
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
          <div className="flex min-h-0 flex-1 flex-col">{content}</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
