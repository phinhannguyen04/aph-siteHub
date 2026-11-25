import { AlertDialog } from '@base-ui/react/alert-dialog'
import { useState } from 'react'
import { c } from '@/lib/copy'
import { Button } from './button'
import { ErrorBox } from './error-box'
import { Field } from './field'

/** Destructive confirmation (Base UI AlertDialog); `requireText` must be typed to enable the action. */
export function Confirm({ title, body, requireText, action, pending, error, onConfirm, onClose }) {
  const [typed, setTyped] = useState('')
  return (
    <AlertDialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="backdrop" />
        <AlertDialog.Viewport className="viewport">
          <AlertDialog.Popup className="dialog dialog-sm">
            <div className="dialog-head">
              <AlertDialog.Title className="dialog-title">{title}</AlertDialog.Title>
            </div>
            <div className="dialog-body">
              <ErrorBox error={error} />
              <AlertDialog.Description className="dialog-text">{body}</AlertDialog.Description>
              {requireText !== undefined && (
                <Field
                  label={c.confirmLogin}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                />
              )}
            </div>
            <div className="dialog-foot">
              <Button variant="ghost" onClick={onClose} disabled={pending}>
                {c.cancel}
              </Button>
              <Button
                variant="danger"
                loading={pending}
                disabled={requireText !== undefined && typed !== requireText}
                onClick={onConfirm}
              >
                {action}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
