'use client'
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { c } from '@/lib/copy'
import { Button } from './button'
import { Modal } from './modal'
export function Confirm({
  title,
  children,
  pending,
  onClose,
  onConfirm,
  disabled = false,
}: {
  title: string
  children: ReactNode
  pending: boolean
  onClose: () => void
  onConfirm: () => void
  disabled?: boolean
}) {
  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-error/15 text-error">
            <TriangleAlert size={16} aria-hidden />
          </span>
          {title}
        </span>
      }
      size="xs"
      onClose={pending ? undefined : onClose}
      actions={
        <>
          <Button className="btn-ghost" disabled={pending} onClick={onClose}>
            {c.cancel}
          </Button>
          <Button className="btn-error" loading={pending} disabled={disabled} onClick={onConfirm}>
            {c.delete}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
