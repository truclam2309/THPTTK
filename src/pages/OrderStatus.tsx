import { useMemo, useState } from 'react';
import { Card, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../contexts/AppContext';
import { formatDateTime } from '../utils/format';

const STATE: Record<string, {label:string;tone:'amber'|'blue'|'green'|'red'|'slate'}> = {
  PENDING:{label:'Chờ chế biến',tone:'amber'}, COOKING:{label:'Đang chế biến',tone:'blue'}, READY:{label:'Đã hoàn thành',tone:'green'}, CANCELLED:{label:'Đã hủy',tone:'red'}, CASHIER_PENDING:{label:'Chờ phục vụ',tone:'green'}, DRAFT:{label:'Chưa gửi bếp',tone:'slate'}
};

export function OrderStatus() {
  const { orders, tables } = useApp();
  const [table, setTable] = useState('');
  const [status, setStatus] = useState('');
  const rows = useMemo(() => orders.filter(o => o.status === 'OPEN').flatMap(o => o.lines.map(line => ({o,line}))).filter(({o,line}) => (!table || o.tableId === table) && (!status || line.status === status)), [orders,table,status]);
  return <div className="px-6 py-6"><PageHeader title="Theo dõi món ăn" subtitle="Cập nhật theo trạng thái order hiện tại; nhân viên phục vụ chỉ xem." />
    <Card><div className="flex flex-wrap gap-3 border-b border-slate-100 p-4"><select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={table} onChange={e=>setTable(e.target.value)}><option value="">Tất cả bàn</option>{tables.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(STATE).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead><tr className="border-b text-xs text-slate-500"><th className="px-5 py-3">Bàn / Order</th><th className="px-5 py-3">Món ăn</th><th className="px-5 py-3">SL</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Gọi món</th><th className="px-5 py-3">Hoàn thành</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(({o,line})=><tr key={`${o.id}-${line.lineId}`}><td className="px-5 py-3">{tables.find(t=>t.id===o.tableId)?.name ?? o.tableId}<div className="text-xs text-slate-400">{o.id}</div></td><td className="px-5 py-3 font-medium">{line.name}</td><td className="px-5 py-3">{line.qty}</td><td className="px-5 py-3"><Badge tone={STATE[line.status]?.tone ?? 'slate'}>{STATE[line.status]?.label ?? line.status}</Badge></td><td className="px-5 py-3 text-slate-600">{line.sentAt ? formatDateTime(line.sentAt) : '—'}</td><td className="px-5 py-3 text-slate-600">{line.readyAt ? formatDateTime(line.readyAt) : '—'}</td></tr>)}{!rows.length&&<tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Không có món phù hợp bộ lọc</td></tr>}</tbody></table></div></Card>
  </div>;
}
