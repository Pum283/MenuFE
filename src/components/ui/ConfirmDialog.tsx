import { Modal } from './Modal'
import { Button } from './Button'

type Props = {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isOpen: boolean
  isConfirming?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmText = 'Xoá',
  cancelText = 'Huỷ',
  isOpen,
  isConfirming,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onCancel}
      maxWidthClassName="max-w-lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={isConfirming}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">{description}</div>
    </Modal>
  )
}

