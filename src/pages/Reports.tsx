import { useMemo, useState } from 'react';
import { ArrowUpRightIcon, BarChart3Icon, ClipboardCheckIcon, PackageIcon, ReceiptTextIcon, SendIcon } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime, formatQty, formatVnd } from '../utils/format';
import type { ReportRecord } from '../types';

const TODAY = new Date().toISOString().slice(0, 10);

function Metric({ label, value, note }: {label: string;value: string;note?: string;}) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="tabular mt-1.5 text-xl font-bold tracking-tight text-slate-900">{value}</p>
    {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
  </div>;
}

function ReportHistoryCard({ report }: {report: ReportRecord;}) {
  const revenue = report.kind === 'REVENUE';
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${revenue ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
            {revenue ? <ReceiptTextIcon className="h-5 w-5" /> : <PackageIcon className="h-5 w-5" />}
          </span>
          <div>
            <h3 className="font-bold text-slate-900">{revenue ? 'Báo cáo doanh thu' : 'Báo cáo cân đối kho'}</h3>
            <p className="mt-1 text-xs text-slate-500">{report.periodStart} → {report.periodEnd} · {report.id}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <ArrowUpRightIcon className="h-3.5 w-3.5" /> Đã gửi Quản lý
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-4 sm:grid-cols-4">
        {revenue ? <>
          <Metric label="Doanh thu thực thu" value={formatVnd(report.metrics.netRevenue ?? 0)} />
          <Metric label="Hóa đơn" value={String(report.metrics.invoiceCount ?? 0)} />
          <Metric label="Giảm giá" value={formatVnd(report.metrics.discount ?? 0)} />
          <Metric label="VAT" value={formatVnd(report.metrics.vat ?? 0)} />
        </> : <>
          <Metric label="Giá trị tồn cuối" value={formatVnd(report.metrics.closingValue ?? 0)} />
          <Metric label="Giá trị nhập" value={formatVnd(report.metrics.receivedValue ?? 0)} />
          <Metric label="Giá trị xuất dùng" value={formatVnd(report.metrics.issuedValue ?? 0)} />
          <Metric label="Mã hàng lệch kiểm kê" value={String(report.metrics.varianceCount ?? 0)} />
        </>}
      </div>
      {!revenue && !!report.stockLines?.length && (
        <details className="border-t border-slate-100">
          <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-brand-700">Xem cân đối theo từng mã sản phẩm</summary>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-xs">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr><th className="px-4 py-2">Mã / sản phẩm</th><th className="px-3 py-2 text-right">Đầu kỳ</th><th className="px-3 py-2 text-right">Nhập</th><th className="px-3 py-2 text-right">Xuất</th><th className="px-3 py-2 text-right">Hủy</th><th className="px-3 py-2 text-right">Hao hụt</th><th className="px-3 py-2 text-right">ĐC tăng</th><th className="px-3 py-2 text-right">ĐC giảm</th><th className="px-3 py-2 text-right">Tồn cuối sổ</th><th className="px-3 py-2 text-right">Kiểm kê</th><th className="px-3 py-2 text-right">Chênh lệch</th><th className="px-4 py-2 text-right">Giá trị tồn</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.stockLines.map((line) => <tr key={line.productId}>
                  <td className="px-4 py-2"><span className="font-mono font-semibold text-slate-700">{line.productCode}</span><span className="ml-2 text-slate-500">{line.productName}</span></td>
                  <td className="tabular px-3 py-2 text-right">{formatQty(line.openingQty, line.unit)}</td>
                  <td className="tabular px-3 py-2 text-right text-emerald-700">{formatQty(line.receivedQty, line.unit)}</td>
                  <td className="tabular px-3 py-2 text-right">{formatQty(line.issuedQty, line.unit)}</td>
                  <td className="tabular px-3 py-2 text-right text-red-600">{formatQty(line.disposedQty, line.unit)}</td>
                  <td className="tabular px-3 py-2 text-right text-orange-600">{formatQty(line.wasteQty, line.unit)}</td>
                  <td className="tabular px-3 py-2 text-right text-emerald-700">{formatQty(line.adjustmentInQty, line.unit)}</td>
                  <td className="tabular px-3 py-2 text-right text-red-600">{formatQty(line.adjustmentOutQty, line.unit)}</td>
                  <td className="tabular px-3 py-2 text-right font-bold">{formatQty(line.closingQty, line.unit)}</td>
                  <td className="tabular px-3 py-2 text-right">{line.countedQty === undefined ? '—' : formatQty(line.countedQty, line.unit)}</td>
                  <td className={`tabular px-3 py-2 text-right font-semibold ${(line.varianceQty ?? 0) === 0 ? 'text-emerald-700' : 'text-red-600'}`}>{line.varianceQty === undefined ? '—' : formatQty(line.varianceQty, line.unit)}</td>
                  <td className="tabular px-4 py-2 text-right">{formatVnd(line.closingValue)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Lập bởi {report.createdBy} ({report.createdByRole}) · {formatDateTime(report.createdAt)}</div>
    </Card>
  );
}

export function Reports() {
  const { user } = useAuth();
  const { orders, reports, createReport, ingredients, transactions } = useApp();
  const [periodStart, setPeriodStart] = useState(TODAY);
  const [periodEnd, setPeriodEnd] = useState(TODAY);
  const [countedStock, setCountedStock] = useState<Record<string, string>>({});
  const isManager = user?.role === 'Quản lý';
  const isCashier = user?.role === 'Thu ngân';
  const isWarehouse = user?.role === 'Nhân viên kho';
  const canSubmit = isCashier || isWarehouse;

  const inPeriod = (timestamp?: string) => !!timestamp && timestamp.slice(0, 10) >= periodStart && timestamp.slice(0, 10) <= periodEnd;
  const paidOrders = orders.filter((order) => order.status === 'PAID' && inPeriod(order.paidAt));
  const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const discount = paidOrders.reduce((sum, order) => sum + order.discount, 0);
  const vat = paidOrders.reduce((sum, order) => sum + order.vat, 0);
  const movements = transactions.filter((tx) => inPeriod(tx.at));
  const availableProducts = ingredients.map((ingredient) => ({
    ingredient,
    bookQty: transactions.filter((tx) => tx.ingredientId === ingredient.id && tx.at.slice(0, 10) <= periodEnd)
      .reduce((sum, tx) => sum + (tx.type === 'NHẬP KHO' || (tx.type === 'ĐIỀU CHỈNH' && /tăng|thừa|dư/i.test(tx.reason)) ? tx.qty : -tx.qty), 0),
    bookValue: transactions.filter((tx) => tx.ingredientId === ingredient.id && tx.at.slice(0, 10) <= periodEnd)
      .reduce((sum, tx) => sum + (tx.type === 'NHẬP KHO' || (tx.type === 'ĐIỀU CHỈNH' && /tăng|thừa|dư/i.test(tx.reason)) ? tx.value : -tx.value), 0)
  }));
  const stockValue = availableProducts.reduce((sum, item) => sum + item.bookValue, 0);

  const visibleReports = useMemo(() => isManager ? reports : reports.filter((report) => report.createdBy === user?.name), [isManager, reports, user?.name]);

  return (
    <div className="px-6 py-6">
      <PageHeader
        title={isManager ? 'Báo cáo gửi đến quản lý' : isCashier ? 'Báo cáo doanh thu' : 'Báo cáo cân đối kho'}
        subtitle={isManager ? 'Xem bản chụp báo cáo do thu ngân và nhân viên kho gửi; dữ liệu giao dịch gốc không thể sửa tại đây.' : 'Chọn kỳ báo cáo, đối chiếu số liệu nguồn rồi gửi bản báo cáo đến Quản lý.'}
      />

      {canSubmit && <Card className="mb-5 overflow-hidden">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              {isCashier ? <ReceiptTextIcon className="h-4 w-4 text-emerald-600" /> : <ClipboardCheckIcon className="h-4 w-4 text-brand-600" />}
              {isCashier ? 'Tạo báo cáo doanh thu từ hóa đơn đã thanh toán' : 'Lập và gửi báo cáo cân đối kho'}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Từ ngày"><input type="date" value={periodStart} max={periodEnd} onChange={(event) => setPeriodStart(event.target.value)} className={inputClass} /></Field>
              <Field label="Đến ngày"><input type="date" value={periodEnd} min={periodStart} onChange={(event) => setPeriodEnd(event.target.value)} className={inputClass} /></Field>
            </div>
          </div>
          <Button disabled={periodStart > periodEnd || (isWarehouse && ingredients.some((item) => countedStock[item.id] === undefined || countedStock[item.id] === '' || !Number.isFinite(Number(countedStock[item.id])) || Number(countedStock[item.id]) < 0))} onClick={() => createReport(isCashier ? 'REVENUE' : 'STOCK_BALANCE', periodStart, periodEnd, Object.fromEntries(Object.entries(countedStock).map(([id, value]) => [id, Number(value)])))}>
            <SendIcon className="h-4 w-4" /> Gửi Quản lý
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-4">
          {isCashier ? <>
            <Metric label="Doanh thu thực thu" value={formatVnd(revenue)} note="Chỉ order đã thanh toán" />
            <Metric label="Hóa đơn / order" value={`${paidOrders.length} / ${new Set(paidOrders.map((order) => order.id)).size}`} />
            <Metric label="Giảm giá" value={formatVnd(discount)} />
            <Metric label="VAT" value={formatVnd(vat)} />
          </> : <>
            <Metric label="Giá trị tồn sổ cuối kỳ" value={formatVnd(stockValue)} note={`Theo sổ đến ${periodEnd}`} />
            <Metric label="Nhập trong kỳ" value={formatVnd(movements.filter((tx) => tx.type === 'NHẬP KHO').reduce((sum, tx) => sum + tx.value, 0))} />
            <Metric label="Xuất dùng trong kỳ" value={formatVnd(movements.filter((tx) => tx.type === 'BÁN HÀNG' || tx.type === 'XUẤT KHO').reduce((sum, tx) => sum + tx.value, 0))} />
            <Metric label="Giao dịch kho" value={String(movements.length)} />
          </>}
        </div>
      </Card>}

      {isWarehouse && <Card className="mb-5">
        <CardHeader title="Đối chiếu tồn kho thực tế" subtitle="Nhập số kiểm kê theo mã hàng; báo cáo đối chiếu với tồn sổ tại ngày kết thúc kỳ." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-5 py-3">Mã sản phẩm</th><th className="px-5 py-3">Sản phẩm</th><th className="px-5 py-3 text-right">Tồn sổ cuối kỳ</th><th className="px-5 py-3 text-right">Tồn tối thiểu</th><th className="px-5 py-3 text-right">Kiểm kê thực tế</th><th className="px-5 py-3 text-right">Giá trị tồn cuối kỳ</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{availableProducts.map(({ ingredient, bookQty, bookValue }) => <tr key={ingredient.id}>
              <td className="px-5 py-3 font-mono text-xs font-semibold text-brand-700">{ingredient.code ?? ingredient.id}</td><td className="px-5 py-3 font-medium text-slate-800">{ingredient.name}</td>
              <td className="tabular px-5 py-3 text-right">{formatQty(bookQty, ingredient.unit)}</td><td className="tabular px-5 py-3 text-right text-slate-500">{formatQty(ingredient.minStock, ingredient.unit)}</td>
              <td className="px-5 py-2"><input aria-label={`Số lượng kiểm kê ${ingredient.name}`} type="number" min="0" step="0.001" value={countedStock[ingredient.id] ?? ''} onChange={(event) => setCountedStock((previous) => ({ ...previous, [ingredient.id]: event.target.value }))} className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-right tabular" placeholder={ingredient.unit} /></td><td className="tabular px-5 py-3 text-right">{formatVnd(bookValue)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 px-5 py-3 text-xs leading-5 text-slate-500">Báo cáo lưu tồn đầu kỳ, nhập, xuất, hủy, hao hụt, điều chỉnh, tồn cuối sổ và số kiểm kê/chênh lệch. Dữ liệu kiểm kê được nhập cho kỳ báo cáo; cần kiểm kê thực tế trước khi gửi.</p>
      </Card>}

      {isManager && <Card className="mb-5 border-brand-100 bg-brand-50/60 px-5 py-4">
        <p className="text-sm font-semibold text-brand-900">Chế độ xem báo cáo</p>
        <p className="mt-1 text-xs leading-5 text-brand-800">Các báo cáo bên dưới là bản chụp số liệu tại thời điểm gửi. Quản lý không sửa hóa đơn, giao dịch kho hoặc số liệu gốc từ màn hình này.</p>
      </Card>}

      <div className="mb-3 flex items-center justify-between gap-3">
        <div><h2 className="text-base font-bold text-slate-900">{isManager ? 'Hộp thư báo cáo' : 'Lịch sử báo cáo đã gửi'}</h2><p className="mt-1 text-xs text-slate-500">{visibleReports.length} báo cáo</p></div>
      </div>
      {visibleReports.length === 0 ? <Card className="px-5 py-12 text-center">
        <BarChart3Icon className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">Chưa có báo cáo được gửi</p>
        <p className="mt-1 text-xs text-slate-500">{isManager ? 'Báo cáo của thu ngân và kho sẽ xuất hiện tại đây.' : 'Tạo báo cáo theo kỳ để lưu bản chụp và chuyển quản lý xem.'}</p>
      </Card> : <div className="space-y-4">{visibleReports.map((report) => <ReportHistoryCard key={report.id} report={report} />)}</div>}

      <p className="mt-5 text-xs leading-5 text-slate-400">Dữ liệu demo được lưu trong state của trình duyệt và mất khi tải lại ứng dụng; thao tác gửi ở đây chuyển báo cáo giữa các vai trò trong cùng phiên, chưa gửi lên server.</p>
    </div>
  );
}
