import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  CameraIcon,
  CheckCircle2Icon,
  PackagePlusIcon,
  QrCodeIcon,
  ScanLineIcon,
  SparklesIcon } from
'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { useApp } from '../contexts/AppContext';
import { formatQty, formatVnd } from '../utils/format';
import { availableQty } from '../utils/inventory';
import type { Batch } from '../types';

type Step = 'scan' | 'form' | 'done';

const UNKNOWN_BARCODE = '8935009900444';

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function Receive() {
  const { batches, ingredients, suppliers, receiveStock, ingredientOf } =
  useApp();
  const [step, setStep] = useState<Step>('scan');
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [created, setCreated] = useState<Batch | null>(null);

  const today = new Date();
  const [form, setForm] = useState({
    ingredientId: 'ING-BO',
    supplierId: 'SUP-01',
    quantity: '20',
    unitCost: '280000',
    receivedAt: toDateInput(today),
    mfgDate: toDateInput(today),
    expiryDate: toDateInput(new Date(Date.now() + 3 * 86_400_000)),
    note: ''
  });

  const startScan = (code: string) => {
    setScanning(true);
    window.setTimeout(() => {
      const known = batches.find((b) => b.barcode === code);
      setBarcode(code);
      setIsNew(!known);
      if (known) {
        const ing = ingredientOf(known.ingredientId);
        setForm((f) => ({
          ...f,
          ingredientId: known.ingredientId,
          supplierId: known.supplierId,
          unitCost: String(ing.refCost)
        }));
      }
      setScanning(false);
      setStep('form');
    }, 1200);
  };

  const submit = () => {
    const batch = receiveStock({
      ingredientId: form.ingredientId,
      barcode: barcode || UNKNOWN_BARCODE,
      supplierId: form.supplierId,
      quantity: Number(form.quantity),
      unitCost: Number(form.unitCost),
      receivedAt: new Date(form.receivedAt).toISOString(),
      mfgDate: new Date(form.mfgDate).toISOString(),
      expiryDate: new Date(form.expiryDate).toISOString(),
      note: form.note
    });
    setCreated(batch);
    setStep('done');
  };

  const ing = ingredientOf(form.ingredientId);

  const steps = [
  { id: 'scan', label: 'Quét mã' },
  { id: 'form', label: 'Thông tin lô' },
  { id: 'done', label: 'Hoàn tất' }];


  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Nhập hàng"
        subtitle="Quét barcode/QR để tạo lô hàng mới với hạn sử dụng và giá nhập"
        action={
        <Link to="/batches">
            <Button variant="secondary">Xem tất cả lô hàng</Button>
          </Link>
        } />
      

      <ol className="mb-5 flex items-center gap-3">
        {steps.map((s, i) => {
          const active = steps.findIndex((x) => x.id === step) >= i;
          return (
            <li key={s.id} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                active ?
                'bg-brand-600 text-white' :
                'bg-slate-200 text-slate-500'}`
                }>
                
                {i + 1}
              </span>
              <span
                className={`text-sm ${active ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                
                {s.label}
              </span>
              {i < steps.length - 1 &&
              <span className="h-px w-10 bg-slate-300" />
              }
            </li>);

        })}
      </ol>

      {step === 'scan' &&
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <CardHeader
            title="Quét barcode / QR code"
            subtitle="Đưa mã trên bao bì vào khung quét" />
          
            <div className="p-6">
              <div className="relative mx-auto flex aspect-video max-w-xl items-center justify-center overflow-hidden rounded-xl bg-slate-900">
                <div className="absolute inset-8 rounded-lg border-2 border-white/30" />
                {scanning &&
              <motion.div
                initial={{ top: '15%' }}
                animate={{ top: '80%' }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'linear'
                }}
                className="absolute left-8 right-8 h-0.5 bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.6)]" />

              }
                <div className="text-center text-white/80">
                  <CameraIcon className="mx-auto h-10 w-10" />
                  <p className="mt-3 text-sm">
                    {scanning ?
                  'Đang đọc mã…' :
                  'Camera sẵn sàng — chọn một mã mẫu để mô phỏng'}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mã mẫu để mô phỏng
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                { code: '8935001100011', label: 'Thịt bò ba chỉ (đã có)' },
                { code: '8935001200028', label: 'Tôm sú tươi (đã có)' },
                { code: '8935001300035', label: 'Rau xà lách (đã có)' },
                { code: UNKNOWN_BARCODE, label: 'Mã chưa có trong hệ thống' }].
                map((b) =>
                <button
                  key={b.code}
                  disabled={scanning}
                  onClick={() => startScan(b.code)}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-left transition-colors duration-150 ease-out hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50">
                  
                      <QrCodeIcon className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="tabular text-sm font-medium text-slate-900">
                          {b.code}
                        </p>
                        <p className="text-xs text-slate-500">{b.label}</p>
                      </div>
                    </button>
                )}
                </div>
              </div>

              <div className="mt-5 flex items-end gap-3">
                <Field label="Hoặc nhập mã thủ công" className="flex-1">
                  <input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Nhập mã barcode"
                  className={inputClass} />
                
                </Field>
                <Button
                variant="secondary"
                onClick={() => barcode && startScan(barcode)}>
                
                  <ScanLineIcon className="h-4 w-4" />
                  Tra cứu
                </Button>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader title="Quy trình nhập kho" />
            <ol className="space-y-4 px-5 py-5 text-sm text-slate-600">
              {[
            'Nhấn + NHẬP HÀNG và mở camera quét barcode/QR.',
            'Hệ thống đọc thông tin sản phẩm. Nếu mã chưa tồn tại, nhân viên tạo sản phẩm mới.',
            'Nhập số lượng thực nhận (ví dụ 20 kg thịt bò ba chỉ).',
            'Nhập hoặc xác nhận hạn sử dụng.',
            'Hệ thống tự sinh mã lô (LOT-BO-001) và cộng tồn kho.',
            'Ghi lịch sử giao dịch NHẬP KHO +20 kg.'].
            map((t, i) =>
            <li key={i} className="flex gap-3">
                  <span className="tabular mt-0.5 h-5 w-5 shrink-0 rounded-full bg-slate-100 text-center text-xs font-semibold leading-5 text-slate-600">
                    {i + 1}
                  </span>
                  {t}
                </li>
            )}
            </ol>
          </Card>
        </div>
      }

      {step === 'form' &&
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-8">
            <CardHeader
            title={isNew ? 'Tạo sản phẩm / lô mới' : 'Thông tin sản phẩm'}
            subtitle={`Mã barcode: ${barcode}`}
            action={
            <Badge tone={isNew ? 'amber' : 'green'} dot>
                  {isNew ? 'Barcode chưa tồn tại' : 'Đã có trong hệ thống'}
                </Badge>
            } />
          
            <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
              <Field label="Nguyên liệu">
                <select
                value={form.ingredientId}
                onChange={(e) =>
                setForm((f) => ({ ...f, ingredientId: e.target.value }))
                }
                className={inputClass}>
                
                  {ingredients.map((i) =>
                <option key={i.id} value={i.id}>
                      {i.name} ({i.unit})
                    </option>
                )}
                </select>
              </Field>
              <Field label="Nhà cung cấp">
                <select
                value={form.supplierId}
                onChange={(e) =>
                setForm((f) => ({ ...f, supplierId: e.target.value }))
                }
                className={inputClass}>
                
                  {suppliers.map((s) =>
                <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                )}
                </select>
              </Field>
              <Field label={`Số lượng (${ing.unit})`}>
                <input
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
                }
                className={inputClass} />
              
              </Field>
              <Field label={`Giá nhập (VNĐ / ${ing.unit})`}>
                <input
                type="number"
                min={0}
                value={form.unitCost}
                onChange={(e) =>
                setForm((f) => ({ ...f, unitCost: e.target.value }))
                }
                className={inputClass} />
              
              </Field>
              <Field label="Ngày nhập">
                <input
                type="date"
                value={form.receivedAt}
                onChange={(e) =>
                setForm((f) => ({ ...f, receivedAt: e.target.value }))
                }
                className={inputClass} />
              
              </Field>
              <Field label="Ngày sản xuất">
                <input
                type="date"
                value={form.mfgDate}
                onChange={(e) =>
                setForm((f) => ({ ...f, mfgDate: e.target.value }))
                }
                className={inputClass} />
              
              </Field>
              <Field
              label="Hạn sử dụng"
              hint="Còn ≤ 2 ngày sẽ tự động vào danh sách cảnh báo">
              
                <input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                setForm((f) => ({ ...f, expiryDate: e.target.value }))
                }
                className={inputClass} />
              
              </Field>
              <Field label="Ghi chú">
                <input
                value={form.note}
                onChange={(e) =>
                setForm((f) => ({ ...f, note: e.target.value }))
                }
                placeholder="Tình trạng hàng, người giao…"
                className={inputClass} />
              
              </Field>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <Button variant="secondary" onClick={() => setStep('scan')}>
                Quét lại
              </Button>
              <Button onClick={submit} disabled={Number(form.quantity) <= 0}>
                <PackagePlusIcon className="h-4 w-4" />
                Lưu vào kho
              </Button>
            </div>
          </Card>

          <Card className="lg:col-span-4">
            <CardHeader title="Xem trước" subtitle="Ảnh hưởng tới tồn kho" />
            <dl className="space-y-3 px-5 py-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Nguyên liệu</dt>
                <dd className="font-medium text-slate-900">{ing.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tồn hiện tại</dt>
                <dd className="tabular text-slate-900">
                  {formatQty(availableQty(batches, ing.id), ing.unit)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Nhập thêm</dt>
                <dd className="tabular font-medium text-emerald-600">
                  +{formatQty(Number(form.quantity) || 0, ing.unit)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3">
                <dt className="text-slate-500">Tồn sau khi nhập</dt>
                <dd className="tabular font-semibold text-slate-900">
                  {formatQty(
                  availableQty(batches, ing.id) + (Number(form.quantity) || 0),
                  ing.unit
                )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Giá trị lô</dt>
                <dd className="tabular font-semibold text-slate-900">
                  {formatVnd(
                  (Number(form.quantity) || 0) * (Number(form.unitCost) || 0)
                )}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      }

      {step === 'done' && created &&
      <Card className="mx-auto max-w-2xl">
          <div className="px-6 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2Icon className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Nhập kho thành công
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hệ thống đã tự động tạo mã lô và ghi lịch sử giao dịch.
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-5 text-left text-sm">
              <div>
                <dt className="text-xs text-slate-500">Mã lô</dt>
                <dd className="text-base font-semibold text-slate-900">
                  {created.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Nguyên liệu</dt>
                <dd className="font-medium text-slate-900">
                  {ingredientOf(created.ingredientId).name}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Tồn kho</dt>
                <dd className="tabular font-medium text-emerald-600">
                  +
                  {formatQty(
                  created.quantity,
                  ingredientOf(created.ingredientId).unit
                )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Giá trị nhập</dt>
                <dd className="tabular font-medium text-slate-900">
                  {formatVnd(created.quantity * created.unitCost)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <SparklesIcon className="h-3.5 w-3.5" />
              Giao dịch “NHẬP KHO +
              {formatQty(
              created.quantity,
              ingredientOf(created.ingredientId).unit
            )}
              ” đã được ghi vào lịch sử kho
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Button
              variant="secondary"
              onClick={() => {
                setCreated(null);
                setBarcode('');
                setStep('scan');
              }}>
              
                Nhập lô tiếp theo
              </Button>
              <Link to="/batches">
                <Button>
                  Xem lô hàng
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      }
    </div>);

}
