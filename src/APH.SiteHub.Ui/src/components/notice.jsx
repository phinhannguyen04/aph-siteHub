import { Toast } from '@base-ui/react/toast'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useCallback } from 'react'
import { c } from '@/lib/copy'

/** Returns `notify(message, severity = 'success' | 'error')`, backed by Base UI Toast. */
export function useNotice() {
  const manager = Toast.useToastManager()
  return useCallback(
    (message, severity = 'success') =>
      manager.add({ title: message, type: severity, timeout: severity === 'error' ? 8000 : 4000 }),
    [manager],
  )
}

export function ToastList() {
  const { toasts } = Toast.useToastManager()
  return (
    <Toast.Portal>
      <Toast.Viewport className="toast-viewport">
        {toasts.map((toast) => (
          <Toast.Root key={toast.id} toast={toast} className="toast" data-type={toast.type}>
            <Toast.Content className="toast-content">
              {toast.type === 'error' ? (
                <CircleAlert size={16} aria-hidden />
              ) : (
                <CircleCheck size={16} aria-hidden />
              )}
              <Toast.Title className="toast-title" />
              <Toast.Close className="toast-close" aria-label={c.dismiss}>
                <X size={14} />
              </Toast.Close>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}
