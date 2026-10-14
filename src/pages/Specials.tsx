import { FlameIcon, TimerIcon } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useApp } from '../contexts/AppContext';
import { formatQty, formatVnd } from '../utils/format';
import { batchState, countdownLabel, daysLeft } from '../utils/inventory';

export function Specials() {
  const { batches, dishes, ingredientOf, toggleSpecial } = useApp();

  const priority = batches.
  filter((b) => batchState(b) === 'NEAR_EXPIRY' && b.quantity > 0).
  sort((a, b) => +new Date(a.expiryDate) - +new Date(b.expiryDate));

  const specials = dishes.filter((d) => d.special);

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Món đặc biệt"
        subtitle="Đẩy nhanh tiêu thụ nguyên liệu sắp hết hạn bằng món ưu tiên trong ngày" />
      

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card>
            <CardHeader
              title="Nguyên liệu cần ưu tiên sử dụng"
              subtitle={`${priority.length} lô còn ≤ 2 ngày sử dụng`} />
            
            {priority.length === 0 &&
            <p className="px-5 py-10 text-center text-sm text-slate-500">
                Không có nguyên liệu nào cần ưu tiên. Kho đang ở trạng thái tốt.
              </p>
            }
            <ul className="divide-y divide-slate-100">
              {priority.map((b) => {
                const ing = ingredientOf(b.ingredientId);
                const options = dishes.filter((d) =>
                d.recipe.some((r) => r.ingredientId === ing.id)
                );
                return (
                  <li key={b.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <TimerIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {ing.name}
                        </p>
                        <p className="tabular text-xs text-slate-500">
                          {formatQty(b.quantity, ing.unit)} · Lô {b.id} · Giá vốn{' '}
                          {formatVnd(b.quantity * b.unitCost)}
                        </p>
                      </div>
                      <Badge tone={daysLeft(b.expiryDate) <= 1 ? 'red' : 'amber'}>
                        {countdownLabel(b.expiryDate)}
                      </Badge>
                    </div>

                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Món đề xuất theo công thức
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {options.map((d) => {
                        const need = d.recipe.find(
                          (r) => r.ingredientId === ing.id
                        )!;
                        return (
                          <button
                            key={d.id}
                            onClick={() =>
                            toggleSpecial(
                              d.id,
                              `Ưu tiên tiêu thụ ${ing.name} — lô ${b.id}`
                            )
                            }
                            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors duration-150 ease-out ${
                            d.special ?
                            'border-orange-400 bg-orange-50' :
                            'border-slate-200 hover:border-brand-300 hover:bg-brand-50'}`
                            }>
                            
                            <img
                              src={d.image}
                              alt=""
                              className="h-9 w-9 rounded-md object-cover" />
                            
                            <span>
                              <span className="block text-sm font-medium text-slate-900">
                                {d.name}
                              </span>
                              <span className="tabular block text-xs text-slate-500">
                                Dùng {formatQty(need.qty, ing.unit)}/phần ·{' '}
                                {formatVnd(d.price)}
                              </span>
                            </span>
                            {d.special ?
                            <Badge tone="orange">Đang là món đặc biệt</Badge> :

                            <Badge tone="blue">Tạo món đặc biệt</Badge>
                            }
                          </button>);

                      })}
                    </div>
                  </li>);

              })}
            </ul>
          </Card>
        </div>

        <div className="xl:col-span-5">
          <Card>
            <CardHeader
              title="🔥 Món đặc biệt hôm nay"
              subtitle="Hiển thị đầu menu màn hình Order" />
            
            {specials.length === 0 ?
            <p className="px-5 py-10 text-center text-sm text-slate-500">
                Chưa có món đặc biệt nào. Chọn một món đề xuất bên trái để đưa
                lên menu.
              </p> :

            <ul className="divide-y divide-slate-100">
                {specials.map((d) =>
              <li key={d.id} className="flex items-center gap-3 px-5 py-4">
                    <img
                  src={d.image}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover" />
                
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <FlameIcon className="h-4 w-4 text-orange-500" />
                        {d.name}
                      </p>
                      <p className="tabular text-sm text-slate-700">
                        {formatVnd(d.price)}
                      </p>
                      {d.specialReason &&
                  <p className="text-xs text-slate-500">
                          {d.specialReason}
                        </p>
                  }
                    </div>
                    <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleSpecial(d.id)}>
                  
                      Gỡ khỏi menu
                    </Button>
                  </li>
              )}
              </ul>
            }
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-600">
              Mục tiêu: tăng khả năng tiêu thụ nguyên liệu trước hạn và giảm chi
              phí hủy hàng.
            </div>
          </Card>
        </div>
      </div>
    </div>);

}
