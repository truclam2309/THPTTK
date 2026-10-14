
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpenIcon,
  CheckIcon,
  ChefHatIcon,
  ClockIcon,
  FlameIcon,
  PackageMinusIcon,
  XCircleIcon,
} from 'lucide-react';

import { PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { WasteModal } from '../components/kitchen/WasteModal';
import { useApp } from '../contexts/AppContext';
import { formatQty, formatTime } from '../utils/format';
import { billableQty, minutesSince } from '../utils/order';
import type { Dish, Order, OrderLine } from '../types';

interface Ticket {
  order: Order;
  line: OrderLine;
}

interface TableTicketGroup {
  tableId: string;
  tableName: string;
  tickets: Ticket[];
}

export function Kitchen() {
  const {
    orders,
    dishOf,
    ingredientOf,
    tableOf,
    startCooking,
    finishLine,
    cancelLine,
    showToast,
  } = useApp();

  const [openRecipe, setOpenRecipe] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Ticket | null>(null);
  const [cancelQty, setCancelQty] = useState('1');
  const [cancelReason, setCancelReason] = useState('Khách đổi ý');
  const [cancelNote, setCancelNote] = useState('');

  const [waste, setWaste] = useState<{
    open: boolean;
    dish: Dish | null;
  }>({
    open: false,
    dish: null,
  });

  // Lấy các món thuộc đơn hàng đang mở, loại món làm sẵn.
  const tickets: Ticket[] = orders
    .filter((order) => order.status === 'OPEN')
    .flatMap((order) =>
      order.lines
        .filter((line) => !dishOf(line.dishId)?.readyMade)
        .map((line) => ({
          order,
          line,
        }))
    );

  // Món chờ nhận.
  const pending = tickets
    .filter((ticket) => ticket.line.status === 'PENDING')
    .sort(
      (a, b) =>
        +new Date(a.line.sentAt ?? 0) -
        +new Date(b.line.sentAt ?? 0)
    );

  // Món đang chế biến.
  const cooking = tickets.filter(
    (ticket) => ticket.line.status === 'COOKING'
  );

  // Các món vừa hoàn thành.
  const done = tickets
    .filter((ticket) => ticket.line.status === 'READY')
    .sort(
      (a, b) =>
        +new Date(b.line.readyAt ?? 0) -
        +new Date(a.line.readyAt ?? 0)
    )
    .slice(0, 8);

  const cancelled = tickets.filter(
    ({ line }) => line.status === 'CANCELLED' || (line.cancellationHistory?.length ?? 0) > 0
  );

  // Nhóm các món có cùng tableId.
  const groupTicketsByTable = (
    items: Ticket[]
  ): TableTicketGroup[] => {
    const groups = new Map<string, Ticket[]>();

    items.forEach((ticket) => {
      const tableKey = String(ticket.order.tableId);

      if (!groups.has(tableKey)) {
        groups.set(tableKey, []);
      }

      groups.get(tableKey)!.push(ticket);
    });

    return Array.from(groups.entries()).map(
      ([tableId, groupTickets]) => ({
        tableId,
        tableName:
          tableOf(groupTickets[0].order.tableId)?.name ??
          'Chưa xác định bàn',
        tickets: groupTickets,
      })
    );
  };

  // Hiển thị từng món và các thao tác của bếp.
  const renderTicket = (ticket: Ticket) => {
    const { order, line } = ticket;

    const dish = dishOf(line.dishId);

    const wait = minutesSince(
      line.status === 'COOKING'
        ? line.startedAt
        : line.sentAt
    );

    const late = wait >= 15;

    const showRecipe = openRecipe === line.lineId;

    return (
      <motion.li
        key={line.lineId}
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{
          duration: 0.18,
          ease: [0.23, 1, 0.32, 1],
        }}
        className="rounded-xl border border-slate-200 bg-white shadow-card"
      >
        <div className="flex items-start gap-3 p-4">
          <span className="tabular flex h-10 min-w-10 items-center justify-center rounded-lg bg-slate-900 px-2 text-lg font-semibold text-white">
            {billableQty(line)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold leading-tight text-slate-900">
              {line.name}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {tableOf(order.tableId)?.name ??
                'Chưa xác định bàn'}{' '}
              · {order.id}
            </p>

            {(line.cancelledQty ?? 0) > 0 && (
              <p className="mt-1 text-xs font-medium text-red-600">Đã hủy {line.cancelledQty} phần</p>
            )}

            {line.note && (
              <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                {line.note}
              </p>
            )}
          </div>

          <span
            className={`tabular flex items-center gap-1 text-xs font-medium ${
              late ? 'text-red-600' : 'text-slate-500'
            }`}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            {wait}′
          </span>
        </div>

        <AnimatePresence initial={false}>
          {showRecipe && dish && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                duration: 0.18,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="overflow-hidden"
            >
              <ul className="mx-4 mb-3 space-y-1 rounded-lg bg-slate-50 px-3 py-2">
                {dish.recipe.map((recipeItem) => {
                  const ingredient = ingredientOf(
                    recipeItem.ingredientId
                  );

                  return (
                    <li
                      key={recipeItem.ingredientId}
                      className="flex justify-between text-xs text-slate-600"
                    >
                      <span>{ingredient.name}</span>

                      <span className="tabular">
                        {formatQty(
                          recipeItem.qty,
                          ingredient.unit
                        )}{' '}
                        × {billableQty(line)} ={' '}
                        <strong className="text-slate-900">
                          {formatQty(
                            recipeItem.qty * billableQty(line),
                            ingredient.unit
                          )}
                        </strong>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setOpenRecipe(
                showRecipe ? null : line.lineId
              )
            }
          >
            <BookOpenIcon className="h-3.5 w-3.5" />
            {showRecipe ? 'Ẩn công thức' : 'Công thức'}
          </Button>

          {line.status === 'PENDING' ? (
            <>
              <Button
                size="sm"
                variant="danger"
                onClick={() => { setCancelTarget(ticket); setCancelQty(String(billableQty(line))); setCancelNote(''); }}
              >
                <XCircleIcon className="h-3.5 w-3.5" />
                Hủy món
              </Button>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => startCooking(order.id, line.lineId)}
              >
                <FlameIcon className="h-3.5 w-3.5" />
                Nhận và chế biến
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="danger"
                onClick={() => { setCancelTarget(ticket); setCancelQty(String(billableQty(line))); setCancelNote(''); }}
              >
                <XCircleIcon className="h-3.5 w-3.5" />
                Hủy món
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="ml-auto"
                onClick={() =>
                  setWaste({
                    open: true,
                    dish: dish ?? null,
                  })
                }
              >
                <PackageMinusIcon className="h-3.5 w-3.5" />
                Hao hụt
              </Button>

              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() =>
                  finishLine(order.id, line.lineId)
                }
              >
                <CheckIcon className="h-3.5 w-3.5" />
                Đã làm xong
              </Button>
            </>
          )}
        </div>
      </motion.li>
    );
  };

  // Hiển thị một cột trạng thái, chia nhóm theo bàn.
  const renderColumn = ({
    title,
    count,
    tone,
    items,
    empty,
  }: {
    title: string;
    count: number;
    tone: string;
    items: Ticket[];
    empty: string;
  }) => {
    const tableGroups = groupTicketsByTable(items);

    return (
      <section className="flex min-w-0 flex-col">
        <div className="mb-3 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${tone}`} />

          <h2 className="text-sm font-semibold text-slate-900">
            {title}
          </h2>

          <span className="tabular rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {count}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            {empty}
          </div>
        ) : (
          <ul className="space-y-4">
            {tableGroups.map((group) => (
              <li
                key={group.tableId}
                className="space-y-2"
              >
                <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2">
                  <span className="font-semibold text-slate-800">
                    {group.tableName}
                  </span>

                  <span className="text-xs text-slate-500">
                    {group.tickets.length} món
                  </span>
                </div>

                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {group.tickets.map(renderTicket)}
                  </AnimatePresence>
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  };

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Màn hình bếp"
        subtitle="Nhận món → xác nhận chế biến → đã làm xong. Món xong sẽ chuyển sang thu ngân."
        action={
          <div className="flex gap-2">
            <Link to="/recipes">
              <Button variant="secondary">
                <BookOpenIcon className="h-4 w-4" />
                Sổ công thức
              </Button>
            </Link>

            <Button
              variant="warning"
              onClick={() =>
                setWaste({
                  open: true,
                  dish: null,
                })
              }
            >
              <PackageMinusIcon className="h-4 w-4" />
              Ghi nhận hao hụt
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {renderColumn({
          title: 'Chờ nhận',
          count: pending.length,
          tone: 'bg-amber-500',
          items: pending,
          empty: 'Không có món mới',
        })}

        {renderColumn({
          title: 'Đang chế biến',
          count: cooking.length,
          tone: 'bg-brand-600',
          items: cooking,
          empty: 'Chưa có món nào đang nấu',
        })}
      </div>

      <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <ChefHatIcon className="h-4 w-4 text-emerald-600" />
        Vừa hoàn thành — đã chuyển thu ngân
      </h2>

      {done.length === 0 ? (
        <p className="text-sm text-slate-500">
          Chưa có món hoàn thành trong ca.
        </p>
      ) : (
        <ul className="space-y-4">
          {groupTicketsByTable(done).map((group) => (
            <li
              key={group.tableId}
              className="space-y-2"
            >
              <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2">
                <span className="font-semibold text-slate-800">
                  {group.tableName}
                </span>

                <span className="text-xs text-slate-500">
                  {group.tickets.length} món
                </span>
              </div>

              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {group.tickets.map((ticket) => (
                  <li
                    key={ticket.line.lineId}
                    className="flex flex-wrap items-center gap-4 px-5 py-3 text-sm"
                  >
                    <CheckIcon className="h-4 w-4 text-emerald-600" />

                    <span className="font-medium text-slate-900">
                      {ticket.line.name} ×{ticket.line.qty}
                    </span>

                    <span className="text-slate-500">
                      {ticket.order.id}
                    </span>

                    <span className="tabular ml-auto text-slate-400">
                      {ticket.line.readyAt &&
                        formatTime(ticket.line.readyAt)}
                    </span>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setWaste({
                          open: true,
                          dish:
                            dishOf(ticket.line.dishId) ??
                            null,
                        })
                      }
                    >
                      Ghi hao hụt
                    </Button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-8 rounded-2xl border border-red-100 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <XCircleIcon className="h-4 w-4 text-red-500" /> Món đã hủy / có phần hủy
            </h2>
            <p className="mt-1 text-xs text-slate-500">Lịch sử hủy được giữ trong order để phục vụ và thu ngân tra cứu.</p>
          </div>
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">{cancelled.length}</span>
        </div>
        {cancelled.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Chưa có món bị hủy.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cancelled.flatMap(({ order, line }) => {
              const history = line.cancellationHistory?.length ? line.cancellationHistory : line.status === 'CANCELLED' ? [{
                qty: line.cancelledQty ?? line.qty,
                reason: line.cancelReason ?? 'Không ghi rõ lý do',
                note: line.cancelNote,
                cancelledBy: line.cancelledBy ?? '—',
                cancelledAt: line.cancelledAt ?? ''
              }] : [];
              return history.map((entry, index) => (
              <li key={`${line.lineId}-${index}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{tableOf(order.tableId)?.name ?? 'Bàn'} · {order.id}</span>
                <span className="font-semibold text-slate-900">{line.name} ×{entry.qty}</span>
                <span className="text-red-700">{entry.reason}{entry.note ? ` — ${entry.note}` : ''}</span>
                <span className="ml-auto text-xs text-slate-400">{entry.cancelledBy}{entry.cancelledAt ? ` · ${formatTime(entry.cancelledAt)}` : ''}</span>
              </li>
            ));}) }
          </ul>
        )}
      </section>

      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Xác nhận hủy món"
        description="Thao tác được lưu vào lịch sử order. Nguyên liệu đã sử dụng không tự động hoàn kho."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>Quay lại</Button>
            <Button
              variant="danger"
              disabled={!cancelTarget || !Number.isInteger(Number(cancelQty)) || Number(cancelQty) < 1 || Number(cancelQty) > billableQty(cancelTarget.line) || !cancelReason}
              onClick={() => {
                if (!cancelTarget) return;
                const ok = cancelLine(cancelTarget.order.id, cancelTarget.line.lineId, Number(cancelQty), cancelReason, cancelNote);
                if (ok) setCancelTarget(null);
                else showToast('Không thể hủy số lượng hoặc trạng thái món hiện tại');
              }}
            >Hủy món</Button>
          </>
        )}
      >
        {cancelTarget && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p><span className="text-slate-500">Bàn:</span> <strong>{tableOf(cancelTarget.order.tableId)?.name ?? '—'}</strong></p>
              <p className="mt-1"><span className="text-slate-500">Mã order:</span> <strong>{cancelTarget.order.id}</strong></p>
              <p className="mt-1"><span className="text-slate-500">Món:</span> <strong>{cancelTarget.line.name}</strong></p>
              <p className="mt-1"><span className="text-slate-500">Còn được phép hủy:</span> <strong>{billableQty(cancelTarget.line)}</strong></p>
            </div>
            <Field label="Số lượng hủy">
              <input type="number" min="1" max={billableQty(cancelTarget.line)} step="1" value={cancelQty} onChange={(event) => setCancelQty(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Lý do hủy">
              <select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className={inputClass}>
                {['Khách đổi ý', 'Order nhầm', 'Thiếu nguyên liệu', 'Món lỗi', 'Không thể chế biến', 'Lý do khác'].map((reason) => <option key={reason}>{reason}</option>)}
              </select>
            </Field>
            <Field label="Ghi chú (không bắt buộc)">
              <textarea rows={3} value={cancelNote} onChange={(event) => setCancelNote(event.target.value)} className={inputClass} placeholder="Bổ sung thông tin cho phục vụ và thu ngân" />
            </Field>
          </div>
        )}
      </Modal>

      <WasteModal
        open={waste.open}
        dish={waste.dish}
        onClose={() =>
          setWaste({
            open: false,
            dish: null,
          })
        }
      />
    </div>
  );
}
