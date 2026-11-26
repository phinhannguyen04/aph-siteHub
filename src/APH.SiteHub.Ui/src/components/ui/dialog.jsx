import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

function Dialog(props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal(props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose(props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-40 bg-black/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    />
  )
}

const panel =
  'flex flex-col overflow-hidden border border-border bg-background text-foreground shadow-[var(--shadow-popup)]'
const contentVariants = {
  default: `${panel} top-1/2 left-1/2 max-h-[calc(100dvh-3rem)] w-[min(480px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-md data-[state=open]:zoom-in-98 data-[state=closed]:zoom-out-98`,
  wide: `${panel} top-1/2 left-1/2 max-h-[calc(100dvh-3rem)] w-[min(600px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-md data-[state=open]:zoom-in-98 data-[state=closed]:zoom-out-98`,
  drawer: `${panel} inset-y-0 right-0 h-dvh w-[min(440px,100%)] rounded-none border-y-0 border-r-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right`,
  // Unstyled: the caller supplies the whole look (used by the mobile sidebar).
  bare: '',
}

function DialogContent({ className, children, variant = 'default', ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        aria-describedby={undefined}
        className={cn(
          'fixed z-50 outline-none duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          contentVariants[variant],
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex items-center justify-between gap-3 border-b border-border px-4 py-3',
        className,
      )}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex justify-end gap-2 border-t border-border bg-secondary px-4 py-3',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('m-0 text-lg font-semibold text-secondary-foreground', className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('m-0', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
