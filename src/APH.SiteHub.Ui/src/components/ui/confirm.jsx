import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { c } from '@/lib/copy'
import { Button } from './app-button'
import { ErrorBox } from './error-box'
import { FormField } from './form-field'

/** Destructive confirmation (shadcn AlertDialog); `requireText` must be typed to enable the action. */
export function Confirm({ title, body, requireText, action, pending, error, onConfirm, onClose }) {
  const [typed, setTyped] = useState('')
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          <ErrorBox error={error} />
          <AlertDialogDescription>{body}</AlertDialogDescription>
          {requireText !== undefined && (
            <FormField
              label={c.confirmLogin}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          )}
        </div>
        <AlertDialogFooter>
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
