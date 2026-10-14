import { useEffect, useState } from 'react';
import { CalculatorIcon, MinusIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { formatQty, formatVnd } from '../utils/format';
import { availableQty } from '../utils/inventory';
import type { RecipeItem } from '../types';

export function Recipes() {
  const { dishes, ingredients, ingredientOf, batches, saveRecipe } = useApp();
  const { user } = useAuth();
  const canEdit = user?.role === 'Quản lý';
  const recipeDishes = dishes.filter((item) => !item.readyMade);
  const [selectedId, setSelectedId] = useState(recipeDishes[0]?.id ?? '');
  const [portions, setPortions] = useState(5);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RecipeItem[]>([]);

  const dish = recipeDishes.find((d) => d.id === selectedId) ?? recipeDishes[0];

  useEffect(() => {
    setEditing(false);
    setDraft(dish?.recipe ?? []);
  }, [dish?.id, dish?.recipe]);

  if (!dish) return null;

  const recipe = editing ? draft : dish.recipe;
  const cost = recipe.reduce((s, r) => s + r.qty * ingredientOf(r.ingredientId).refCost, 0);
  const unused = ingredients.filter((i) => !draft.some((r) => r.ingredientId === i.id));

  return (
    <div className="px-6 py-6">
      <PageHeader
        title={canEdit ? 'Quản lý công thức' : 'Sổ công thức'}
        subtitle="Định lượng nguyên liệu cho từng món — cơ sở để hệ thống trừ kho khi thanh toán" />
      

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader title="Món ăn cần chế biến" subtitle={`${recipeDishes.length} món`} />
          <ul className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto scroll-thin">
            {recipeDishes.map((d) =>
            <li key={d.id}>
                <button
                onClick={() => setSelectedId(d.id)}
                className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors duration-150 ease-out ${
                dish.id === d.id ? 'bg-brand-50' : 'hover:bg-slate-50'}`
                }>
                
                  <img src={d.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{d.name}</p>
                    <p className="tabular text-xs text-slate-500">
                      {formatVnd(d.price)} · {d.recipe.length ? `${d.recipe.length} nguyên liệu` : 'chưa có công thức'}
                    </p>
                  </div>
                </button>
              </li>
            )}
          </ul>
        </Card>

        <div className="space-y-4 xl:col-span-8">
          <Card>
            <CardHeader
              title={dish.name}
              subtitle={`Giá bán ${formatVnd(dish.price)} · Giá vốn ${formatVnd(cost)} / phần`}
              action={
              <div className="flex items-center gap-2">
                  <Badge tone="green">Biên {dish.price ? ((dish.price - cost) / dish.price * 100).toFixed(0) : 0}%</Badge>
                  {canEdit && !editing &&
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                      <PencilIcon className="h-3.5 w-3.5" />
                      Sửa công thức
                    </Button>
                }
                </div>
              } />
            
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5 font-medium">Nguyên liệu</th>
                  <th className="px-5 py-2.5 text-right font-medium">Định lượng / phần</th>
                  <th className="px-5 py-2.5 text-right font-medium">Giá vốn</th>
                  <th className="px-5 py-2.5 text-right font-medium">Tồn khả dụng</th>
                  {editing && <th className="w-12 px-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipe.map((r, idx) => {
                  const ing = ingredientOf(r.ingredientId);
                  return (
                    <tr key={r.ingredientId}>
                      <td className="px-5 py-2.5 font-medium text-slate-900">
                        {editing ?
                        <select
                          value={r.ingredientId}
                          onChange={(e) =>
                          setDraft((d) => d.map((x, i) => i === idx ? { ...x, ingredientId: e.target.value } : x))
                          }
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm">
                          
                            {[ing, ...unused].map((o) =>
                          <option key={o.id} value={o.id}>{o.name}</option>
                          )}
                          </select> :

                        ing.name
                        }
                      </td>
                      <td className="tabular px-5 py-2.5 text-right">
                        {editing ?
                        <span className="inline-flex items-center gap-1.5">
                            <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={r.qty}
                            onChange={(e) =>
                            setDraft((d) => d.map((x, i) => i === idx ? { ...x, qty: Number(e.target.value) } : x))
                            }
                            className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right text-sm" />
                          
                            <span className="w-8 text-left text-xs text-slate-500">{ing.unit}</span>
                          </span> :

                        formatQty(r.qty, ing.unit)
                        }
                      </td>
                      <td className="tabular px-5 py-2.5 text-right text-slate-600">{formatVnd(r.qty * ing.refCost)}</td>
                      <td className="tabular px-5 py-2.5 text-right text-slate-600">{formatQty(availableQty(batches, ing.id), ing.unit)}</td>
                      {editing &&
                      <td className="px-3">
                          <button
                          onClick={() => setDraft((d) => d.filter((_, i) => i !== idx))}
                          aria-label={`Bỏ ${ing.name}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                          
                            <Trash2Icon className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      }
                    </tr>);

                })}
                {recipe.length === 0 &&
                <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                      Món chưa có công thức{canEdit ? ' — nhấn “Sửa công thức” để thêm nguyên liệu.' : '.'}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            {editing &&
            <div className="flex items-center gap-2 border-t border-slate-200 px-5 py-3">
                <Button
                size="sm"
                variant="ghost"
                disabled={unused.length === 0}
                onClick={() => setDraft((d) => [...d, { ingredientId: unused[0].id, qty: 0.1 }])}>
                
                  <PlusIcon className="h-3.5 w-3.5" />
                  Thêm nguyên liệu
                </Button>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => {setDraft(dish.recipe);setEditing(false);}}>
                    Hủy
                  </Button>
                  <Button
                  size="sm"
                  disabled={draft.some((r) => !(r.qty > 0))}
                  onClick={() => {saveRecipe(dish.id, draft);setEditing(false);}}>
                  
                    Lưu công thức
                  </Button>
                </div>
              </div>
            }
          </Card>

          <Card>
            <CardHeader
              title="Mô phỏng trừ kho"
              subtitle="Khi thanh toán, định lượng nhân với số phần đã bán"
              action={
              <div className="flex items-center gap-1">
                  <button onClick={() => setPortions((p) => Math.max(1, p - 1))} aria-label="Giảm số phần" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
                    <MinusIcon className="h-3.5 w-3.5" />
                  </button>
                  <span className="tabular w-12 text-center text-sm font-semibold">{portions}</span>
                  <button onClick={() => setPortions((p) => p + 1)} aria-label="Tăng số phần" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              } />
            
            <div className="px-5 py-4">
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <CalculatorIcon className="h-4 w-4 text-brand-600" />
                Bán <strong>{portions}</strong> phần {dish.name} → hệ thống trừ:
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {recipe.map((r) => {
                  const ing = ingredientOf(r.ingredientId);
                  const need = r.qty * portions;
                  return (
                    <li key={r.ingredientId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                      <span className="text-slate-700">{ing.name}</span>
                      <span className="tabular">
                        <span className="font-semibold text-red-600">−{formatQty(need, ing.unit)}</span>
                        <span className="ml-2 text-slate-500">còn {formatQty(Math.max(availableQty(batches, ing.id) - need, 0), ing.unit)}</span>
                      </span>
                    </li>);

                })}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>);

}
