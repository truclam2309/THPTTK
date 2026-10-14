import { PrinterIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { InvoiceReceipt } from './InvoiceReceipt';
import type { Order } from '../../types';

export function InvoiceModal({
  order,
  provisional = false,
  title,
  onClose





}: {order: Order | null;provisional?: boolean;title?: string;onClose: () => void;}) {
  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={title ?? (provisional ? 'Phiếu tạm tính' : `Hóa đơn ${order?.id ?? ''}`)}
      width="max-w-md"
      footer={
      <>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={() => window.print()}>
            <PrinterIcon className="h-4 w-4" />
            {provisional ? 'In tạm tính' : 'In hóa đơn'}
          </Button>
        </>
      }>
      
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {order && <InvoiceReceipt order={order} provisional={provisional} />}
      </div>
    </Modal>);

}
