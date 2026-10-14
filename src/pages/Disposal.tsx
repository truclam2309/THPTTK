import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../contexts/AppContext';
import { formatDateTime, formatQty, formatVnd } from '../utils/format';

export function Disposal() {
  const { transactions, ingredientOf, batches } = useApp();

  const rows = transactions.
  filter((t) => t.type === 'HỦY' || t.type === 'HAO HỤT').
  sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const total = rows.reduce((s, t) => s + t.value, 0);
  const disposedCount = batches.filter((b) => b.cancelled).length;

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Hủy / Hao hụt"
        subtitle="Lịch sử hủy hàng — dữ liệu lô được giữ lại (soft delete, status = CANCELLED)" />
      

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="px-5 py-4">
          <p className="text-xs text-slate-500">Tổng chi phí hao hụt</p>
          <p className="tabular mt-1 text-2xl font-semibold text-red-600">
            {formatVnd(total)}
          </p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-xs text-slate-500">Số lô đã hủy</p>
          <p className="tabular mt-1 text-2xl font-semibold text-slate-900">
            {disposedCount}
          </p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-xs text-slate-500">Số lần ghi nhận</p>
          <p className="tabular mt-1 text-2xl font-semibold text-slate-900">
            {rows.length}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Lịch sử hủy hàng" subtitle={`${rows.length} bản ghi`} />
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5 font-medium">Thời gian</th>
                <th className="px-5 py-2.5 font-medium">Loại</th>
                <th className="px-5 py-2.5 font-medium">Mã lô</th>
                <th className="px-5 py-2.5 font-medium">Nguyên liệu</th>
                <th className="px-5 py-2.5 text-right font-medium">Số lượng</th>
                <th className="px-5 py-2.5 font-medium">Lý do</th>
                <th className="px-5 py-2.5 font-medium">Người thực hiện</th>
                <th className="px-5 py-2.5 text-right font-medium">Giá trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) =>
              <tr key={t.id}>
                  <td className="tabular px-5 py-3 text-slate-500">
                    {formatDateTime(t.at)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={t.type === 'HỦY' ? 'red' : 'orange'}>
                      {t.type}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {t.batchId}
                  </td>
                  <td className="px-5 py-3">
                    {ingredientOf(t.ingredientId).name}
                  </td>
                  <td className="tabular px-5 py-3 text-right">
                    {formatQty(t.qty, t.unit)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{t.reason}</td>
                  <td className="px-5 py-3 text-slate-500">{t.user}</td>
                  <td className="tabular px-5 py-3 text-right font-medium text-red-600">
                    {formatVnd(t.value)}
                  </td>
                </tr>
              )}
              {rows.length === 0 &&
              <tr>
                  <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm text-slate-500">
                  
                    Chưa có giao dịch hủy hoặc hao hụt nào.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>);

}
