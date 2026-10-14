import { useEffect, useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';
import { useApp } from '../../contexts/AppContext';
import { dishImages } from '../../data/seed';
import type { Dish, DishCategory } from '../../types';

const CATEGORIES: DishCategory[] = ['Món chính', 'Khai vị', 'Hải sản', 'Thịt', 'Rau', 'Đồ uống'];

export function DishFormModal({
  open,
  dish,
  onClose




}: {open: boolean;dish: Dish | null;onClose: () => void;}) {
  const { saveDish, ingredients } = useApp();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<DishCategory>('Món chính');
  const [image, setImage] = useState(dishImages[0]);
  const [readyMade, setReadyMade] = useState(false);
  const [stockIngredientId, setStockIngredientId] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(dish?.name ?? '');
    setPrice(dish ? String(dish.price) : '');
    setCategory(dish?.category ?? 'Món chính');
    setImage(dish?.image ?? dishImages[0]);
    setReadyMade(!!dish?.readyMade);
    setStockIngredientId(dish?.stockIngredientId ?? '');
  }, [open, dish]);

  const valid = name.trim() && Number(price) > 0 && (!readyMade || !!stockIngredientId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={dish ? `Sửa món — ${dish.name}` : 'Thêm món mới'}
      description={dish ? undefined : 'Sau khi lưu, vào Công thức để khai báo định lượng nguyên liệu.'}
      footer={
      <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
          disabled={!valid}
          onClick={() => {
            saveDish({
              id: dish?.id ?? `DISH-${Date.now().toString(36)}`,
              recipe: readyMade ? [] : dish?.recipe ?? [],
              stockIngredientId: readyMade ? stockIngredientId : undefined,
              special: dish?.special,
              specialReason: dish?.specialReason,
              name: name.trim(),
              price: Number(price),
              category,
              image,
              readyMade
            });
            onClose();
          }}>
          
            Lưu món
          </Button>
        </>
      }>
      
      <div className="space-y-4">
        <Field label="Tên món">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="vd: Bò nướng lá lốt" className={inputClass} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Giá bán (VNĐ)">
            <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="150000" className={inputClass} />
          </Field>
          <Field label="Danh mục">
            <select value={category} onChange={(e) => setCategory(e.target.value as DishCategory)} className={inputClass}>
              {CATEGORIES.map((c) =>
              <option key={c}>{c}</option>
              )}
            </select>
          </Field>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">Luồng xử lý</p>
          <div className="grid grid-cols-2 gap-2">
            {[
            { v: false, title: 'Cần chế biến', desc: 'Gửi xuống màn hình bếp' },
            { v: true, title: 'Món có sẵn', desc: 'Nước, bánh tráng → thẳng thu ngân' }].
            map((o) =>
            <button
              key={String(o.v)}
              type="button"
              onClick={() => setReadyMade(o.v)}
              className={`rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ease-out ${
              readyMade === o.v ? 'border-brand-600 bg-brand-50' : 'border-slate-300 hover:bg-slate-50'}`
              }>
              
                <p className="text-sm font-medium text-slate-900">{o.title}</p>
                <p className="text-xs text-slate-500">{o.desc}</p>
              </button>
            )}
          </div>
        </div>

        {readyMade && (
          <Field label="Mã sản phẩm quản lý tồn kho">
            <select value={stockIngredientId} onChange={(event) => setStockIngredientId(event.target.value)} className={inputClass}>
              <option value="">Chọn sản phẩm trong danh mục kho</option>
              {ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.code ?? ingredient.id} · {ingredient.name} ({ingredient.unit})</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-500">Khi thu ngân xác nhận hoàn thành, hệ thống xuất tồn sản phẩm theo FEFO. Đây không phải công thức món.</p>
          </Field>
        )}

        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">Hình ảnh</p>
          <div className="grid grid-cols-6 gap-2">
            {dishImages.map((src) =>
            <button
              key={src}
              type="button"
              onClick={() => setImage(src)}
              className={`relative aspect-square overflow-hidden rounded-md ring-2 ${image === src ? 'ring-brand-600' : 'ring-transparent'}`}
              aria-label="Chọn ảnh">
              
                <img src={src} alt="" className="h-full w-full object-cover" />
                {image === src &&
              <span className="absolute inset-0 flex items-center justify-center bg-brand-600/40">
                    <CheckIcon className="h-4 w-4 text-white" />
                  </span>
              }
              </button>
            )}
          </div>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Hoặc dán URL ảnh"
            className={`${inputClass} mt-2 text-xs`} />
          
        </div>
      </div>
    </Modal>);

}
