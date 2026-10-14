import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenIcon, FlameIcon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DishFormModal } from '../components/dishes/DishFormModal';
import { useApp } from '../contexts/AppContext';
import { formatVnd } from '../utils/format';
import { servingsAvailable } from '../utils/inventory';
import type { Dish } from '../types';

export function Dishes() {
  const { dishes, batches, ingredientOf, toggleSpecial, deleteDish, dishSold } = useApp();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<{open: boolean;dish: Dish | null;}>({ open: false, dish: null });
  const [confirm, setConfirm] = useState<Dish | null>(null);

  const rows = dishes.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Quản lý món ăn"
        subtitle="Thêm, sửa, xóa món — giá vốn tính tự động theo công thức"
        action={
        <Button onClick={() => setForm({ open: true, dish: null })}>
            <PlusIcon className="h-4 w-4" />
            Thêm món
          </Button>
        } />
      

      <Card>
        <CardHeader
          title={`${rows.length} món trên thực đơn`}
          action={
          <div className="relative w-64">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm món"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100" />
            
            </div>
          } />
        
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5 font-medium">Món</th>
                <th className="px-5 py-2.5 font-medium">Danh mục</th>
                <th className="px-5 py-2.5 font-medium">Luồng</th>
                <th className="px-5 py-2.5 text-right font-medium">Giá bán</th>
                <th className="px-5 py-2.5 text-right font-medium">Giá vốn</th>
                <th className="px-5 py-2.5 text-right font-medium">Biên LN</th>
                <th className="px-5 py-2.5 text-right font-medium">Bán hôm nay</th>
                <th className="px-5 py-2.5 font-medium">Khả dụng</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => {
                const cost = d.recipe.reduce((s, r) => s + r.qty * ingredientOf(r.ingredientId).refCost, 0);
                const margin = d.price ? (d.price - cost) / d.price * 100 : 0;
                const servings = servingsAvailable(d, batches);
                return (
                  <tr key={d.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={d.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <div>
                          <p className="flex items-center gap-1.5 font-medium text-slate-900">
                            {d.name}
                            {d.special && <FlameIcon className="h-3.5 w-3.5 text-orange-500" aria-label="Món đặc biệt" />}
                          </p>
                          {d.recipe.length === 0 &&
                          <Link to="/recipes" className="text-xs text-red-600 hover:underline">
                              Chưa có công thức
                            </Link>
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{d.category}</td>
                    <td className="px-5 py-3">
                      <Badge tone={d.readyMade ? 'violet' : 'blue'}>{d.readyMade ? 'Có sẵn' : 'Qua bếp'}</Badge>
                    </td>
                    <td className="tabular px-5 py-3 text-right font-medium">{formatVnd(d.price)}</td>
                    <td className="tabular px-5 py-3 text-right text-slate-600">{formatVnd(cost)}</td>
                    <td className="tabular px-5 py-3 text-right font-medium text-emerald-600">{margin.toFixed(0)}%</td>
                    <td className="tabular px-5 py-3 text-right">{dishSold[d.id] ?? 0}</td>
                    <td className="px-5 py-3">
                      <Badge tone={servings > 5 ? 'green' : servings > 0 ? 'amber' : 'red'}>Còn {servings}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => toggleSpecial(d.id)} aria-label="Món đặc biệt" title={d.special ? 'Gỡ món đặc biệt' : 'Đặt món đặc biệt'}>
                          <FlameIcon className={`h-3.5 w-3.5 ${d.special ? 'text-orange-500' : ''}`} />
                        </Button>
                        <Link to="/recipes">
                          <Button size="sm" variant="ghost" aria-label="Công thức" title="Công thức">
                            <BookOpenIcon className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" onClick={() => setForm({ open: true, dish: d })} aria-label="Sửa" title="Sửa">
                          <PencilIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirm(d)} aria-label="Xóa" title="Xóa">
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>
      </Card>

      <DishFormModal open={form.open} dish={form.dish} onClose={() => setForm({ open: false, dish: null })} />
      <ConfirmDialog
        open={!!confirm}
        title="Xóa món ăn"
        message={<>Xóa <strong>{confirm?.name}</strong> khỏi thực đơn? Hóa đơn cũ vẫn giữ nguyên thông tin món.</>}
        confirmLabel="Xóa món"
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && deleteDish(confirm.id)} />
      
    </div>);

}
