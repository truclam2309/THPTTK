import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  danger = true,
  onConfirm,
  onClose








}: {open: boolean;title: string;message: React.ReactNode;confirmLabel?: string;danger?: boolean;onConfirm: () => void;onClose: () => void;}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-md"
      footer={
      <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}>
          
            {confirmLabel}
          </Button>
        </>
      }>
      
      <div className="text-sm text-slate-600">{message}</div>
    </Modal>);

}