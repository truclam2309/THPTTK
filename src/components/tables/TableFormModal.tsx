import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';
import { useApp } from '../../contexts/AppContext';
import type { DiningTable } from '../../types';

export function TableFormModal({
  open,
  table,
  defaultAreaId,
  onClose





}: {open: boolean;table: DiningTable | null;defaultAreaId: string;onClose: () => void;}) {
  const { areas, saveTable } = useApp();
  const [name, setName] = useState('');
  const [seats, setSeats] = useState('4');
  const [areaId, setAreaId] = useState(defaultAreaId);

  useEffect(() => {
    if (!open) return;
    setName(table?.name ?? '');
    setSeats(String(table?.seats ?? 4));
    setAreaId(table?.areaId ?? defaultAreaId);
  }, [open, table, defaultAreaId]);

  const valid = name.trim().length > 0 && Number(seats) > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={table ? `Sửa ${table.name}` : 'Thêm bàn mới'}
      width="max-w-md"
      footer={
      <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
          disabled={!valid}
          onClick={() => {
            saveTable({
              id: table?.id ?? `T-${Date.now().toString(36)}`,
              name: name.trim(),
              seats: Number(seats),
              areaId
            });
            onClose();
          }}>
          
            Lưu bàn
          </Button>
        </>
      }>
      
      <div className="space-y-4">
        <Field label="Tên bàn">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="vd: Bàn 07"
            className={inputClass}
            autoFocus />
          
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Số ghế">
            <input
              type="number"
              min={1}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className={inputClass} />
            
          </Field>
          <Field label="Khu vực">
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className={inputClass}>
              
              {areas.map((a) =>
              <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              )}
            </select>
          </Field>
        </div>
      </div>
    </Modal>);

}
