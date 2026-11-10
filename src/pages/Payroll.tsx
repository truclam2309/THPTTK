import { useMemo, useState } from 'react';
import { Card, PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import type { PayrollRecord } from '../types';
import { formatVnd } from '../utils/format';

const KEY = 'bepkho.payroll';
function readPayroll(month = new Date().toISOString().slice(0, 7)): PayrollRecord[] {
  let rows: PayrollRecord[];
  try { rows = JSON.parse(localStorage.getItem(KEY) || '[]') as PayrollRecord[]; }
  catch { rows = []; }
  if (rows.some(row => row.month === month && row.demo)) return rows;
  const examples = [
    { username:'nguyenminhquan', name:'Nguyễn Minh Quân', department:'Quản lý', workDays:22, hours:176, ratePerDay:400_000 },
    { username:'lethanhdat', name:'Lê Thành Đạt', department:'Bếp', workDays:23, hours:184, ratePerDay:250_000 },
    { username:'phamthuha', name:'Phạm Thu Hà', department:'Phục vụ', workDays:21, hours:168, ratePerDay:220_000 },
    { username:'vongoclan', name:'Võ Ngọc Lan', department:'Thu ngân', workDays:22, hours:176, ratePerDay:250_000 },
    { username:'tranvankhoa', name:'Trần Văn Khoa', department:'Nhân viên kho', workDays:20, hours:160, ratePerDay:230_000 },
    { username:'nguyenthutrang', name:'Nguyễn Thu Trang', department:'Kế toán', workDays:22, hours:176, ratePerDay:300_000 }
  ].map(line => ({ ...line, amount:line.workDays * line.ratePerDay }));
  const demo: PayrollRecord = {
    id:`BL-DEMO-${month.replace('-', '')}`, month, createdAt:new Date().toISOString(), createdBy:'Nguyễn Minh Quân',
    lines:examples, total:examples.reduce((sum, line) => sum + line.amount, 0), status:'PENDING_ACCOUNTING', demo:true
  };
  const next = [demo, ...rows];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function Payroll() {
  const { user } = useAuth();
  const isAccountant = user?.role === 'Kế toán';
  const [rows, setRows] = useState<PayrollRecord[]>(readPayroll);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [notes, setNotes] = useState<Record<string, string>>({});
  const visible = useMemo(() => rows.filter(row => !month || row.month === month), [rows, month]);
  const makeDemo = () => {
    const demo = readPayroll(month).find(row => row.month === month && row.demo);
    if (!demo) return;
    const next = [demo, ...rows.filter(row => !(row.month === month && row.demo))];
    setRows(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const process = (row: PayrollRecord, status: PayrollRecord['status']) => {
    const note = (notes[row.id] || '').trim();
    if (status === 'REVISION_REQUESTED' && !note) return;
    const next = rows.map(item => item.id === row.id ? {
      ...item, status, accountingNote: note, reviewedAt: new Date().toISOString(), reviewedBy: user?.name
    } : item);
    setRows(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return <div className="px-6 py-6">
    <PageHeader title={isAccountant ? 'Kiểm tra bảng lương' : 'Bảng lương'} subtitle="Bảng lương được tính từ ngày công đã xác nhận và mức lương theo công." />
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
      <p>Quản lý xác nhận bảng công và gửi bảng lương. Kế toán kiểm tra, duyệt hoặc yêu cầu quản lý rà soát lại.</p>
      <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2">Tháng <input type="month" className="rounded-lg border border-blue-200 bg-white px-3 py-2" value={month} onChange={event => setMonth(event.target.value)} /></label>{!isAccountant && <Button variant="secondary" onClick={makeDemo}>Lập bảng lương demo</Button>}</div>
    </div>
    {!visible.length ? <Card className="p-8 text-center text-sm text-slate-500">Chưa có bảng lương trong tháng này. Quản lý có thể lập bảng từ màn hình Chấm công.</Card> : visible.map(row => <Card key={row.id} className="mb-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div><h2 className="font-semibold">Bảng lương {row.month} {row.demo && <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Dữ liệu demo</span>}</h2><p className="mt-1 text-xs text-slate-500">{row.id} · Lập bởi {row.createdBy} · {new Date(row.createdAt).toLocaleString('vi-VN')}</p></div>
        <div className="text-right"><p className="text-xs text-slate-500">Tổng lương</p><p className="text-lg font-bold">{formatVnd(row.total)}</p><p className="text-xs font-medium text-slate-600">{row.status === 'ACCOUNTANT_APPROVED' ? 'Kế toán đã duyệt' : row.status === 'REVISION_REQUESTED' ? 'Yêu cầu quản lý rà soát' : 'Chờ kế toán kiểm tra'}</p></div>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b text-left text-xs text-slate-500"><th className="p-3">Nhân viên</th><th>Bộ phận</th><th>Công</th><th>Tổng giờ</th><th>Lương / công</th><th>Thành tiền</th></tr></thead><tbody>{row.lines.map(line => <tr key={line.username} className="border-b"><td className="p-3">{line.name}</td><td>{line.department}</td><td>{line.workDays}</td><td>{line.hours.toFixed(2)}</td><td>{formatVnd(line.ratePerDay)}</td><td className="font-semibold">{formatVnd(line.amount)}</td></tr>)}</tbody></table></div>
      {row.accountingNote && <p className="border-t border-slate-100 px-4 py-3 text-sm text-amber-800">Ghi chú kế toán: {row.accountingNote}</p>}
      {isAccountant && row.status !== 'ACCOUNTANT_APPROVED' && <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4"><input className="min-w-64 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Ghi chú kế toán / lý do yêu cầu rà soát" value={notes[row.id] ?? ''} onChange={event => setNotes({ ...notes, [row.id]: event.target.value })} /><Button onClick={() => process(row, 'ACCOUNTANT_APPROVED')}>Duyệt bảng lương</Button><Button variant="secondary" onClick={() => process(row, 'REVISION_REQUESTED')} disabled={!(notes[row.id] || '').trim()}>Yêu cầu rà soát</Button></div>}
      {row.reviewedBy && <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Xử lý bởi {row.reviewedBy} · {row.reviewedAt ? new Date(row.reviewedAt).toLocaleString('vi-VN') : ''}</p>}
    </Card>)}
  </div>;
}
