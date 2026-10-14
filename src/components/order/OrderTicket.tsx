import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LockIcon,
  MinusIcon,
  PlusIcon,
  SendIcon,
  StickyNoteIcon,
  Trash2Icon } from
'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Field, inputClass } from '../ui/Field';
import { useApp } from '../../contexts/AppContext';
import { formatVnd } from '../../utils/format';
import { billableQty, LINE_LABEL, LINE_TONE, orderTotals } from '../../utils/order';
import type { Order, OrderLine } from '../../types';

/** Phục vụ chỉ được sửa bản nháp chưa gửi */
const editable = (l: OrderLine) => l.status === 'DRAFT';

export function OrderTicket({ order }: {order: Order | undefined;}) {
  const { updateLine, removeLine, submitOrder, showToast, dishOf } = useApp();
  const [noteLine, setNoteLine] = useState<OrderLine | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  if (!order || order.lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-sm font-medium text-slate-600">Bàn chưa gọi món</p>
        <p className="mt-1 text-xs text-slate-400">
          Chọn món bên trái để bắt đầu order
        </p>
      </div>);

  }

  const drafts = order.lines.filter((l) => l.status === 'DRAFT');
  const sent = order.lines.filter((l) => l.status !== 'DRAFT');
  const totals = orderTotals(order.lines);

  const renderLine = (l: OrderLine) => {
    const canEdit = editable(l);
    const ready = dishOf(l.dishId)?.readyMade;
    return (
      <motion.li
        key={l.lineId}
        layout
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        className="px-5 py-3">
        
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">{l.name}</p>
            <p className="tabular text-xs text-slate-500">
              {formatVnd(l.price)} · {ready ? 'Món có sẵn' : 'Qua bếp'}
            </p>
          </div>
          {l.status !== 'DRAFT' &&
          <Badge tone={LINE_TONE[l.status]}>{LINE_LABEL[l.status]}</Badge>
          }
        </div>
        {l.note &&
        <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
            Ghi chú: {l.note}
          </p>
        }
        <div className="mt-2 flex items-center justify-between">
          {canEdit ?
          <div className="flex items-center gap-1">
              <button
              onClick={() =>
              l.qty > 1 ?
              updateLine(order.id, l.lineId, { qty: l.qty - 1 }) :
              removeLine(order.id, l.lineId)
              }
              aria-label="Giảm"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100">
              
                <MinusIcon className="h-3.5 w-3.5" />
              </button>
            <span className="tabular w-8 text-center text-sm font-semibold">{billableQty(l)}</span>
              <button
              onClick={() => updateLine(order.id, l.lineId, { qty: l.qty + 1 })}
              aria-label="Tăng"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100">
              
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
              <button
              onClick={() => {
                setNoteLine(l);
                setNoteDraft(l.note ?? '');
              }}
              aria-label="Ghi chú"
              className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100">
              
                <StickyNoteIcon className="h-3.5 w-3.5" />
              </button>
              <button
              onClick={() => removeLine(order.id, l.lineId)}
              aria-label={`Xóa ${l.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">
              
                <Trash2Icon className="h-3.5 w-3.5" />
              </button>
            </div> :

          <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <LockIcon className="h-3 w-3" />
              ×{l.qty} · Order đã gửi, không thể sửa tại đây
            </span>
          }
          <span className="tabular text-sm font-semibold text-slate-900">
            {formatVnd(l.price * billableQty(l))}
          </span>
        </div>
        {(l.cancelledQty ?? 0) > 0 && <p className="mt-2 text-xs font-medium text-red-600">Đã hủy {l.cancelledQty} phần{l.cancelReason ? ` · ${l.cancelReason}` : ''}</p>}
      </motion.li>);

  };

  return (
    <>
      <div className="flex-1 overflow-y-auto scroll-thin">
          {drafts.length > 0 &&
        <section>
            <p className="bg-amber-50 px-5 py-2 text-xs font-semibold text-amber-800">
              Chưa gửi · {drafts.reduce((s, l) => s + l.qty, 0)} món
            </p>
            <ul className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>{drafts.map(renderLine)}</AnimatePresence>
            </ul>
          </section>
        }
        {sent.length > 0 &&
        <section>
            <p className="bg-slate-50 px-5 py-2 text-xs font-semibold text-slate-600">
              Đã gửi · {sent.reduce((s, l) => s + l.qty, 0)} món
            </p>
            <ul className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>{sent.map(renderLine)}</AnimatePresence>
            </ul>
          </section>
        }
      </div>

      <div className="border-t border-slate-200 px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-slate-600">Tạm tính (gồm VAT 8%)</span>
          <span className="tabular text-xl font-semibold text-slate-900">
            {formatVnd(totals.total)}
          </span>
        </div>
        <Button
          size="lg"
          className="mt-3 w-full"
          disabled={drafts.length === 0}
          onClick={() => {
            const r = submitOrder(order.id);
            const parts = [];
            if (r.kitchen) parts.push(`${r.kitchen} món xuống bếp`);
            if (r.cashier) parts.push(`${r.cashier} món có sẵn chuyển thu ngân`);
            showToast(`Đã gửi order: ${parts.join(', ')}`);
          }}>
          
          <SendIcon className="h-4 w-4" />
          Xác nhận gửi order
        </Button>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Món cần chế biến → Bếp · Món có sẵn (nước, bánh tráng…) → Thu ngân
        </p>
      </div>

      <Modal
        open={!!noteLine}
        onClose={() => setNoteLine(null)}
        title={`Ghi chú — ${noteLine?.name ?? ''}`}
        width="max-w-md"
        footer={
        <>
            <Button variant="secondary" onClick={() => setNoteLine(null)}>
              Hủy
            </Button>
            <Button
            onClick={() => {
              if (noteLine) updateLine(order.id, noteLine.lineId, { note: noteDraft });
              setNoteLine(null);
            }}>
            
              Lưu ghi chú
            </Button>
          </>
        }>
        
        <Field label="Yêu cầu của khách">
          <textarea
            rows={3}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Ví dụ: ít cay, không hành, chín kỹ…"
            className={inputClass} />
          
        </Field>
      </Modal>
    </>);

}
