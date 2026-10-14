import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Field, inputClass } from '../components/ui/Field';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

const ROLES = [
{
  role: 'Quản lý',
  perms: 'Thêm/sửa/xóa món ăn, công thức, bàn và khu vực; xem doanh thu, báo cáo, tồn kho'
},
{
  role: 'Phục vụ',
  perms: 'Xem bàn trống/có khách, gọi món, thêm/sửa/xóa món, xác nhận gửi order'
},
{
  role: 'Bếp',
  perms: 'Xem công thức, xác nhận chế biến, xác nhận đã làm xong, ghi nhận hao hụt'
},
{
  role: 'Thu ngân',
  perms: 'Theo dõi trạng thái món, thanh toán (tự trừ định lượng), in hóa đơn, lịch sử hóa đơn'
},
{
  role: 'Nhân viên kho',
  perms: 'Nhập hàng, quét mã, tạo lô, theo dõi hạn, xử lý hủy, hao hụt'
}];


export function Settings() {
  const { ingredients } = useApp();
  const { user } = useAuth();

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Cài đặt"
        subtitle="Ngưỡng cảnh báo, thuế và phân quyền người dùng" />
      

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Quy tắc cảnh báo"
            subtitle="Áp dụng cho toàn bộ nguyên liệu" />
          
          <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
            <Field label="Ngưỡng sắp hết hạn (ngày)">
              <input defaultValue={2} type="number" className={inputClass} />
            </Field>
            <Field label="Thuế VAT (%)">
              <input defaultValue={8} type="number" className={inputClass} />
            </Field>
            <Field label="Nguyên tắc xuất kho">
              <select defaultValue="FEFO" className={inputClass}>
                <option value="FEFO">FEFO — Lô hết hạn trước dùng trước</option>
                <option value="FIFO">FIFO — Nhập trước xuất trước</option>
              </select>
            </Field>
            <Field label="Kiểm tra hạn sử dụng">
              <select defaultValue="daily" className={inputClass}>
                <option value="daily">Tự động hằng ngày lúc 06:00</option>
                <option value="realtime">Theo thời gian thực</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Tồn kho tối thiểu"
            subtitle="Cảnh báo khi tồn khả dụng xuống dưới mức này" />
          
          <ul className="divide-y divide-slate-100">
            {ingredients.map((i) =>
            <li
              key={i.id}
              className="flex items-center justify-between px-5 py-2.5 text-sm">
              
                <span className="text-slate-700">{i.name}</span>
                <span className="tabular text-slate-500">
                  {i.minStock} {i.unit}
                </span>
              </li>
            )}
          </ul>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Phân quyền"
            subtitle={`Bạn đang đăng nhập với vai trò ${user?.role ?? ''}`} />
          
          <ul className="divide-y divide-slate-100">
            {ROLES.map((r) =>
            <li key={r.role} className="flex items-start gap-4 px-5 py-3.5">
                <div className="w-40 shrink-0">
                  <span className="text-sm font-medium text-slate-900">
                    {r.role}
                  </span>
                  {r.role === user?.role &&
                <Badge tone="blue" className="ml-2">
                      Bạn
                    </Badge>
                }
                </div>
                <p className="text-sm text-slate-600">{r.perms}</p>
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>);

}
