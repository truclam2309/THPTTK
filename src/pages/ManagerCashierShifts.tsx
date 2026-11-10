import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { useApp } from '../contexts/AppContext';
import { formatDateTime, formatVnd } from '../utils/format';

export function ManagerCashierShifts() {
  const { cashierShifts } = useApp();
  const shifts = cashierShifts.filter((shift) => shift.status !== 'OPEN');

  return <div className="px-6 py-6">
    <PageHeader title="Báo cáo chốt ca thu ngân" subtitle="Các ca đã chốt được gửi để Quản lý và Kế toán cùng theo dõi." />
    <Card className="overflow-hidden">
      <CardHeader title={`${shifts.length} ca đã chốt`} subtitle="Thông tin kiểm đếm và chênh lệch tại thời điểm chốt ca." />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-sm">
          <thead><tr className="border-b text-left text-xs text-slate-500"><th className="px-5 py-3">Mã ca</th><th className="px-5 py-3">Thu ngân</th><th className="px-5 py-3">Giờ chốt</th><th className="px-5 py-3">Tiền mặt đầu ca</th><th className="px-5 py-3">Tiền mặt cuối ca dự kiến</th><th className="px-5 py-3">Tiền kiểm đếm</th><th className="px-5 py-3">Chênh lệch</th><th className="px-5 py-3">Trạng thái</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{shifts.map((shift) => <tr key={shift.id}>
            <td className="px-5 py-3 font-medium">{shift.id}</td><td className="px-5 py-3">{shift.cashier}</td><td className="px-5 py-3">{shift.closedAt ? formatDateTime(shift.closedAt) : '—'}</td><td className="px-5 py-3">{formatVnd(shift.openingCash)}</td><td className="px-5 py-3">{formatVnd(shift.expectedCash ?? 0)}</td><td className="px-5 py-3">{formatVnd(shift.actualCash ?? 0)}</td><td className="px-5 py-3">{formatVnd(shift.variance ?? 0)}{shift.varianceReason && <p className="mt-1 text-xs text-slate-500">{shift.varianceReason}</p>}</td><td className="px-5 py-3">{shift.status === 'ACCOUNTING_RECEIVED' ? 'Kế toán đã tiếp nhận' : shift.status === 'REVIEW' ? 'Cần kiểm tra lại' : 'Chờ kế toán tiếp nhận'}</td>
          </tr>)}{!shifts.length && <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500">Chưa có ca được chốt.</td></tr>}</tbody>
        </table>
      </div>
    </Card>
  </div>;
}
