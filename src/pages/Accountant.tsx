import { useMemo, useState } from 'react';
import { CheckCircle2Icon, CircleDollarSignIcon, Clock3Icon, FileTextIcon, SearchIcon, ShieldAlertIcon } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Field, inputClass } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { formatDateTime, formatVnd } from '../utils/format';
import type { PurchaseRequest, PurchaseRequestStatus } from '../types';

type Tab = 'overview' | 'requests' | 'reconciliation' | 'reports';
const STATUS: Record<PurchaseRequestStatus, string> = { PENDING: 'Chờ quản lý duyệt', APPROVED: 'Đã duyệt ngân sách', REJECTED: 'Từ chối', REVISION_REQUESTED: 'Yêu cầu chỉnh sửa', MANAGER_APPROVED: 'Chờ kế toán tiếp nhận', ACCOUNTING_PENDING: 'Kế toán đang xử lý', ACCOUNTING_RECEIVED: 'Kế toán đã tiếp nhận', COMPLETED: 'Đã hoàn tất', DRAFT: 'Bản nháp' };
const total = (r: PurchaseRequest) => r.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);

export function Accountant({ initialTab }: { initialTab: Tab }) {
  const { user } = useAuth();
  const { purchaseRequests, processPurchaseRequest, orders, transactions, ingredients, batches, suppliers, cashierShifts, processCashierShift } = useApp();
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);
  const [action, setAction] = useState<Exclude<PurchaseRequestStatus, 'PENDING'> | null>(null);
  const [reason, setReason] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [start, setStart] = useState(new Date().toISOString().slice(0, 8) + '01');
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filtered = useMemo(() => purchaseRequests.filter((r) =>
    (status === 'ALL' || r.status === status) &&
    (`${r.id} ${r.requester} ${r.department}`.toLowerCase().includes(query.toLowerCase())) &&
    r.requestedAt.slice(0, 10) >= start && r.requestedAt.slice(0, 10) <= end
  ), [purchaseRequests, query, status, start, end]);

  const paid = orders.filter((o) => o.status === 'PAID' && o.paidAt && o.paidAt.slice(0, 10) >= start && o.paidAt.slice(0, 10) <= end);
  const revenue = paid.reduce((sum, o) => sum + o.total, 0);
  const cogs = paid.reduce((sum, o) => sum + (o.cost ?? 0), 0);
  const submitAction = () => {
    if (!selected || !action) return;
    const transition = user?.role === 'Quản lý' ? (action === 'APPROVED' ? 'MANAGER_APPROVED' : action) : (action === 'APPROVED' && selected.status === 'MANAGER_APPROVED' ? 'ACCOUNTING_PENDING' : action === 'APPROVED' && selected.status === 'ACCOUNTING_PENDING' ? 'COMPLETED' : action);
    const result = processPurchaseRequest(selected.id, transition, reason);
    if (result) { setError(result); return; }
    setSuccess(`${STATUS[action]} thành công.`); setSelected(null); setAction(null); setReason(''); setError('');
  };

  const requestRows = filtered;
  const titles: Record<Tab, [string, string]> = {
    overview: ['Tổng quan kế toán', 'Ngân sách đề nghị và hiệu quả kinh doanh theo dữ liệu đang có.'],
    requests: [user?.role === 'Quản lý' ? 'Phê duyệt đề nghị nhập kho' : 'Tiếp nhận đề nghị nhập kho', 'Quản lý phê duyệt trước; kế toán tiếp nhận xử lý ngân sách sau.'],
    reconciliation: ['Đối chiếu ngân sách', 'Chi phí nhập kho chỉ tổng hợp giao dịch nhập kho ghi nhận từ ngày đề nghị trở đi.'],
    reports: ['Báo cáo tài chính', 'Doanh thu lấy từ đơn đã thanh toán; giá vốn lấy từ trường cost trên đơn.']
  };

  return <div className="mx-auto max-w-7xl px-6 py-6">
    <PageHeader title={titles[initialTab][0]} subtitle={titles[initialTab][1]} />
    {success && <div role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Phạm vi dữ liệu:</strong> Đây là prototype lưu nghiệp vụ trong trình duyệt. Chưa có API/backend hoặc hóa đơn mua hàng. Phê duyệt đề nghị không làm thay đổi tồn kho.</div>

    {(initialTab === 'overview' || initialTab === 'reports') && <>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Đề nghị chờ xử lý" value={String(purchaseRequests.filter((r) => ['PENDING','MANAGER_APPROVED','ACCOUNTING_PENDING'].includes(r.status)).length)} icon={<Clock3Icon className="h-5 w-5" />} />
        <Metric title="Ngân sách đề xuất" value={formatVnd(purchaseRequests.reduce((s, r) => s + total(r), 0))} icon={<FileTextIcon className="h-5 w-5" />} />
        <Metric title="Ngân sách đã duyệt" value={formatVnd(purchaseRequests.filter((r) => ['APPROVED','MANAGER_APPROVED','ACCOUNTING_PENDING','COMPLETED'].includes(r.status)).reduce((s, r) => s + total(r), 0))} icon={<CheckCircle2Icon className="h-5 w-5" />} />
        <Metric title="Doanh thu / giá vốn kỳ" value={`${formatVnd(revenue)} / ${formatVnd(cogs)}`} icon={<CircleDollarSignIcon className="h-5 w-5" />} />
      </div>
      <Card className="mb-5 p-5"><div className="grid gap-3 sm:grid-cols-2"><Field label="Từ ngày"><input type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} /></Field><Field label="Đến ngày"><input type="date" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} /></Field></div><p className="mt-3 text-sm text-slate-600">Lợi nhuận gộp ước tính: <strong className="text-slate-900">{formatVnd(revenue - cogs)}</strong>. Giá vốn là số được ghi tại thanh toán; không suy ra từ toàn bộ hàng mua.</p></Card>
    </>}

    {(initialTab === 'requests' || initialTab === 'overview') && <RequestsCard requests={requestRows} query={query} setQuery={setQuery} status={status} setStatus={setStatus} start={start} setStart={setStart} end={end} setEnd={setEnd} onSelect={setSelected} />}
    {initialTab === 'reports' && <CashierReports shifts={cashierShifts} onProcess={processCashierShift} />}

    {initialTab === 'reconciliation' && <Reconciliation requests={purchaseRequests} transactions={transactions} start={start} end={end} setStart={setStart} setEnd={setEnd} query={query} setQuery={setQuery} suppliers={suppliers} batches={batches} />}

    {initialTab === 'reports' && <Card className="overflow-hidden">
      <CardHeader title="Doanh thu và giá vốn theo đơn đã thanh toán" subtitle="Chi phí mua hàng và công nợ NCC chưa có mô hình dữ liệu." />
      <TableWrap><table className="w-full text-sm"><thead><tr><th>Ngày thanh toán</th><th>Mã đơn</th><th>Doanh thu</th><th>Giá vốn ghi nhận</th><th>Lợi nhuận gộp ước tính</th></tr></thead><tbody>
        {paid.map((o) => <tr key={o.id}><td>{o.paidAt && formatDateTime(o.paidAt)}</td><td>{o.id}</td><td>{formatVnd(o.total)}</td><td>{formatVnd(o.cost ?? 0)}</td><td>{formatVnd(o.total - (o.cost ?? 0))}</td></tr>)}
      </tbody></table></TableWrap>
      <div className="flex justify-end p-4"><Button variant="secondary" onClick={() => {
        const csv = ['Ngay,Ma don,Doanh thu,Gia von,Loi nhuan', ...paid.map((o) => `${o.paidAt?.slice(0, 10)},${o.id},${o.total},${o.cost ?? 0},${o.total - (o.cost ?? 0)}`)].join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
        a.download = `bao-cao-ke-toan-${start}-${end}.csv`; a.click(); URL.revokeObjectURL(a.href);
      }}>Xuất CSV (Excel)</Button></div>
    </Card>}

    <Modal open={!!selected} onClose={() => { setSelected(null); setAction(null); setError(''); }} title={selected ? `Chi tiết đề nghị ${selected.id}` : ''} description="Phê duyệt chỉ xác nhận đề nghị, không thay đổi tồn kho." width="max-w-3xl" footer={selected && (user?.role === 'Quản lý' ? selected.status === 'PENDING' && selected.requester !== user.name : user?.role === 'Kế toán' && ['MANAGER_APPROVED','ACCOUNTING_PENDING'].includes(selected.status)) ? <><Button variant="secondary" onClick={() => setSelected(null)}>Đóng</Button>{selected.status === 'PENDING' && user?.role === 'Quản lý' && <Button variant="secondary" onClick={() => { setAction('REVISION_REQUESTED'); setReason(''); }}>Yêu cầu chỉnh sửa</Button>}<Button variant="danger" onClick={() => { setAction('REJECTED'); setReason(''); }}>Từ chối</Button><Button onClick={() => { setAction('APPROVED'); setReason(''); }}>{user?.role === 'Quản lý' ? 'Phê duyệt & chuyển kế toán' : selected.status === 'MANAGER_APPROVED' ? 'Tiếp nhận xử lý' : 'Xác nhận hoàn tất'}</Button></> : undefined}>
      {selected && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><Info label="Ngày tạo" value={formatDateTime(selected.requestedAt)} /><Info label="Người đề nghị" value={`${selected.requester} · ${selected.department}`} /><Info label="Ngân sách đề xuất" value={formatVnd(total(selected))} /></div><p className="rounded-lg bg-slate-50 p-3 text-sm"><strong>Lý do:</strong> {selected.reason}<br /><strong>Ghi chú:</strong> {selected.note || '—'}</p><TableWrap><table className="w-full text-sm"><thead><tr><th>Nguyên liệu</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>{selected.lines.map((line, i) => { const item = ingredients.find((x) => x.id === line.ingredientId); return <tr key={`${line.ingredientId}-${i}`}><td>{item?.name ?? line.ingredientId}</td><td>{line.quantity} {item?.unit}</td><td>{formatVnd(line.unitCost)}</td><td>{formatVnd(line.quantity * line.unitCost)}</td></tr>; })}</tbody></table></TableWrap><p className="text-sm">Ngân sách phân bổ/còn lại: <span className="text-slate-500">Chưa được hệ thống theo dõi.</span></p><div><h3 className="mb-2 font-semibold">Lịch sử xử lý</h3>{selected.history.length ? selected.history.map((event) => <div key={event.id} className="border-l-2 border-slate-200 py-2 pl-3 text-sm"><strong>{event.action}</strong> · {event.actor} · {formatDateTime(event.at)}{event.reason && <p className="text-slate-500">Lý do: {event.reason}</p>}</div>) : <p className="text-sm text-slate-500">Chưa xử lý.</p>}</div></div>}
    </Modal>
    <Modal open={!!action} onClose={() => { setAction(null); setError(''); }} title={action === 'APPROVED' ? 'Xác nhận xử lý đề nghị' : action === 'REJECTED' ? 'Từ chối đề nghị' : 'Yêu cầu chỉnh sửa'} description="Hành động sẽ được ghi vào lịch sử đề nghị." footer={<><Button variant="secondary" onClick={() => setAction(null)}>Hủy</Button><Button variant={action === 'REJECTED' ? 'danger' : 'primary'} onClick={submitAction}>Xác nhận</Button></>}>
      {action && action !== 'APPROVED' && <Field label="Lý do / nội dung cần sửa"><textarea className={`${inputClass} min-h-24`} value={reason} onChange={(e) => setReason(e.target.value)} required /></Field>}{error && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-700"><ShieldAlertIcon className="h-4 w-4" />{error}</p>}
    </Modal>
  </div>;
}

function CashierReports({shifts,onProcess}:{shifts:ReturnType<typeof useApp>['cashierShifts'];onProcess:ReturnType<typeof useApp>['processCashierShift']}){
 const [selected,setSelected]=useState<string|null>(null);const [note,setNote]=useState('');const [error,setError]=useState('');
 const rows=shifts.filter(s=>s.status!=='OPEN');
 return <Card className="mb-5 overflow-hidden"><CardHeader title="Báo cáo chốt ca thu ngân" subtitle="Chỉ hiển thị ca đã chốt, chờ kế toán tiếp nhận hoặc kiểm tra lại."/><TableWrap><table className="w-full min-w-[800px] text-sm"><thead><tr><th>Mã ca</th><th>Thu ngân</th><th>Giờ mở / chốt</th><th>Tiền đầu ca</th><th>Doanh thu tiền mặt</th><th>Chênh lệch</th><th>Trạng thái</th><th/></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td>{s.id}</td><td>{s.cashier}</td><td>{formatDateTime(s.openedAt)}<div>{s.closedAt&&formatDateTime(s.closedAt)}</div></td><td>{formatVnd(s.openingCash)}</td><td>{formatVnd(s.cashSales??0)}</td><td>{formatVnd(s.variance??0)}</td><td>{s.status==='ACCOUNTING_RECEIVED'?'Kế toán đã tiếp nhận':s.status==='REVIEW'?'Cần kiểm tra lại':'Chờ kế toán tiếp nhận'}</td><td><Button size="sm" variant="secondary" onClick={()=>setSelected(selected===s.id?null:s.id)}>Chi tiết</Button></td></tr>)}{!rows.length&&<tr><td colSpan={8} className="py-8 text-center text-slate-400">Chưa có ca được chốt.</td></tr>}</tbody></table></TableWrap>{selected&&(()=>{const s=rows.find(x=>x.id===selected);return s?<div className="border-t p-4 text-sm"><h3 className="mb-3 font-semibold">Chi tiết ca {s.id}</h3><div className="grid gap-2 sm:grid-cols-2"><Info label="Tiền mặt đầu ca" value={formatVnd(s.openingCash)}/><Info label="Doanh thu tiền mặt" value={formatVnd(s.cashSales??0)}/><Info label="Chuyển khoản" value={formatVnd(s.transferSales??0)}/><Info label="Phương thức khác" value={formatVnd(s.otherSales??0)}/><Info label="Tiền mặt dự kiến" value={formatVnd(s.expectedCash??0)}/><Info label="Tiền mặt thực tế" value={formatVnd(s.actualCash??0)}/><Info label="Chênh lệch / lý do" value={`${formatVnd(s.variance??0)} · ${s.varianceReason||'Không có'}`}/></div>{s.status!=='ACCOUNTING_RECEIVED'&&<div className="mt-4 flex flex-wrap gap-2"><input className={inputClass+' max-w-sm'} placeholder="Ghi chú tiếp nhận / yêu cầu rà soát" value={note} onChange={e=>setNote(e.target.value)}/><Button onClick={()=>{const err=onProcess(s.id,'ACCOUNTING_RECEIVED',note);setError(err??'');}} >Tiếp nhận ca</Button><Button variant="secondary" onClick={()=>{const err=onProcess(s.id,'REVIEW',note);setError(err??'');}}>Yêu cầu kiểm tra lại</Button></div>}{(error||s.accountingNote)&&<p className="mt-2 text-red-600">{error||s.accountingNote}</p>}</div>:null})()}</Card>;
}

function Metric({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) { return <Card className="p-4"><div className="flex items-center justify-between text-slate-500"><span className="text-xs font-medium">{title}</span>{icon}</div><p className="mt-3 text-lg font-bold text-slate-900">{value}</p></Card>; }
function RequestsCard({ requests, query, setQuery, status, setStatus, start, setStart, end, setEnd, onSelect }: { requests: PurchaseRequest[]; query: string; setQuery: (v: string) => void; status: string; setStatus: (v: string) => void; start: string; setStart: (v: string) => void; end: string; setEnd: (v: string) => void; onSelect: (r: PurchaseRequest) => void }) {
  const rows = requests.filter((r) => (`${r.id} ${r.requester} ${r.department}`.toLowerCase().includes(query.toLowerCase())) && (status === 'ALL' || r.status === status));
  return <Card className="mb-5 overflow-hidden">
    <CardHeader title="Đề nghị nhập hàng" subtitle="Danh sách sẽ hiển thị khi có dữ liệu đề nghị được tạo." />
    <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-3">
      <div className="relative"><SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className={`${inputClass} pl-9`} placeholder="Mã phiếu hoặc người đề nghị" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value="ALL">Mọi trạng thái</option>{Object.entries(STATUS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select>
      <div className="flex gap-2"><input aria-label="Từ ngày" type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} /><input aria-label="Đến ngày" type="date" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} /></div>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{['Mã phiếu / ngày', 'Người đề nghị', 'Hàng hóa', 'Ngân sách', 'Trạng thái', ''].map((x) => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
      {rows.map((r) => <tr key={r.id}><td className="px-4 py-3"><strong>{r.id}</strong><div className="text-xs text-slate-500">{formatDateTime(r.requestedAt)}</div></td><td className="px-4 py-3">{r.requester}<div className="text-xs text-slate-500">{r.department}</div></td><td className="px-4 py-3">{r.lines.length} mặt hàng</td><td className="px-4 py-3 font-semibold">{formatVnd(total(r))}</td><td className="px-4 py-3"><Badge tone={r.status === 'APPROVED' ? 'green' : r.status === 'REJECTED' ? 'red' : r.status === 'PENDING' ? 'amber' : 'blue'}>{STATUS[r.status]}</Badge></td><td className="px-4 py-3"><Button size="sm" variant="secondary" onClick={() => onSelect(r)}>Chi tiết</Button></td></tr>)}
      {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Chưa có đề nghị nào phù hợp.</td></tr>}
    </tbody></table></div>
  </Card>;
}
function Reconciliation({ requests, transactions, start, end, setStart, setEnd, query, setQuery, suppliers, batches }: { requests: PurchaseRequest[]; transactions: ReturnType<typeof useApp>['transactions']; start: string; end: string; setStart: (v: string) => void; setEnd: (v: string) => void; query: string; setQuery: (v: string) => void; suppliers: ReturnType<typeof useApp>['suppliers']; batches: ReturnType<typeof useApp>['batches'] }) {
  return <Card className="overflow-hidden">
    <CardHeader title="Bảng đối chiếu đề nghị" subtitle="Khoản nhập được ghép theo nguyên liệu và thời điểm; cần mã liên kết chứng từ để đối chiếu chính xác." />
    <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-3"><input aria-label="Từ ngày" type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} /><input aria-label="Đến ngày" type="date" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} /><select className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)}><option value="">Tất cả nhà cung cấp</option>{suppliers.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
    <TableWrap><table className="w-full min-w-[780px] text-sm"><thead><tr><th>Mã đề nghị</th><th>Nhà cung cấp*</th><th>Ngân sách duyệt</th><th>Nhập kho ghi nhận</th><th>Chênh lệch**</th><th>Trạng thái</th></tr></thead><tbody>
      {requests.filter((r) => r.status === 'APPROVED' && r.requestedAt.slice(0, 10) >= start && r.requestedAt.slice(0, 10) <= end).filter((r) => !query || r.lines.some((line) => batches.some((b) => b.ingredientId === line.ingredientId && suppliers.find((s) => s.id === b.supplierId)?.name === query))).map((r) => {
        const actual = transactions.filter((tx) => tx.type === 'NHẬP KHO' && tx.at >= r.requestedAt && r.lines.some((line) => line.ingredientId === tx.ingredientId)).reduce((sum, tx) => sum + tx.value, 0);
        const budget = total(r); const delta = actual - budget;
        return <tr key={r.id}><td>{r.id}</td><td>Chưa liên kết</td><td>{formatVnd(budget)}</td><td>{actual ? formatVnd(actual) : 'Chưa có chứng từ liên kết'}</td><td>{actual ? `${formatVnd(delta)} (${budget ? (delta / budget * 100).toFixed(1) : 0}%)` : '—'}</td><td>Chưa đối chiếu</td></tr>;
      })}
      {!requests.some((r) => r.status === 'APPROVED') && <tr><td colSpan={6}>Chưa có đề nghị đã duyệt.</td></tr>}
    </tbody></table></TableWrap>
    <p className="px-5 py-3 text-xs text-slate-500">* Nhà cung cấp và hóa đơn chưa được liên kết với đề nghị. **Tạm tính theo nguyên liệu trùng nhau, không thay thế đối chiếu chứng từ.</p>
  </Card>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
function TableWrap({ children }: { children: React.ReactNode }) { return <div className="overflow-x-auto px-4"><table className="w-full min-w-[700px] text-sm [&_td]:border-b [&_td]:border-slate-100 [&_td]:px-3 [&_td]:py-3 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:text-slate-500">{children}</table></div>; }
