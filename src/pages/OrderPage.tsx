import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, FlameIcon, SearchIcon } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { OrderTicket } from '../components/order/OrderTicket';
import { useApp } from '../contexts/AppContext';
import { formatVnd } from '../utils/format';
import { servingsAvailable } from '../utils/inventory';

const CATEGORIES = [
'Tất cả',
'Món đặc biệt',
'Món chính',
'Khai vị',
'Hải sản',
'Thịt',
'Rau',
'Đồ uống'] as
const;

export function OrderPage() {
  const { tableId = '' } = useParams();
  const { dishes, batches, tableOf, areas, openOrderOf, addLine } = useApp();
  const [category, setCategory] = useState<string>('Tất cả');
  const [query, setQuery] = useState('');

  const table = tableOf(tableId);
  const order = openOrderOf(tableId);

  const visible = useMemo(
    () =>
    dishes.filter((d) => {
      const matchCat =
      category === 'Tất cả' || (
      category === 'Món đặc biệt' ? !!d.special : d.category === category);
      return matchCat && d.name.toLowerCase().includes(query.toLowerCase());
    }),
    [dishes, category, query]
  );

  if (!table) return <Navigate to="/tables" replace />;

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <Link
            to="/tables"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            
            <ArrowLeftIcon className="h-4 w-4" />
            Sơ đồ bàn
          </Link>
          <div className="relative max-w-xs flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm món…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100" />
            
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {CATEGORIES.map((c) =>
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-out ${
              category === c ?
              'bg-slate-900 text-white' :
              'bg-slate-100 text-slate-600 hover:bg-slate-200'}`
              }>
              
                {c === 'Món đặc biệt' && <FlameIcon className="h-3 w-3 text-orange-500" />}
                {c}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin bg-slate-100 p-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
            {visible.map((dish) => {
              const servings = servingsAvailable(dish, batches);
              const soldOut = servings <= 0;
              return (
                <button
                  key={dish.id}
                  onClick={() => !soldOut && addLine(tableId, dish)}
                  disabled={soldOut}
                  className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-card transition-transform duration-150 ease-out ${
                  soldOut ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 hover:border-brand-300'}`
                  }>
                  
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
                    {dish.special &&
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-1 text-[11px] font-semibold text-white">
                        <FlameIcon className="h-3 w-3" />
                        Món đặc biệt
                      </span>
                    }
                    {soldOut &&
                    <span className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-white">
                        Hết nguyên liệu
                      </span>
                    }
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-sm font-semibold leading-snug text-slate-900">{dish.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {dish.readyMade ? 'Món có sẵn' : dish.category}
                    </p>
                    <div className="mt-auto flex items-end justify-between pt-3">
                      <span className="tabular text-sm font-semibold text-slate-900">
                        {formatVnd(dish.price)}
                      </span>
                      <Badge tone={servings <= 0 ? 'red' : servings <= 5 ? 'amber' : 'green'}>
                        Còn {servings}
                      </Badge>
                    </div>
                  </div>
                </button>);

            })}
          </div>
        </div>
      </div>

      <aside className="flex w-[380px] shrink-0 flex-col border-l border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">{table.name}</h2>
            <Badge tone={order ? 'blue' : 'slate'} dot>
              {order ? 'Có khách' : 'Trống'}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {areas.find((a) => a.id === table.areaId)?.name} · {table.seats} ghế
            {order && ` · ${order.id}`}
          </p>
        </div>
        <OrderTicket order={order} />
      </aside>
    </div>);

}
