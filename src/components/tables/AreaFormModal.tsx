import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';
import { useApp } from '../../contexts/AppContext';
import type { Area } from '../../types';

export function AreaFormModal({
  open,
  area,
  onClose,
  onSaved





}: {open: boolean;area: Area | null;onClose: () => void;onSaved: (id: string) => void;}) {
  const { saveArea } = useApp();
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName(area?.name ?? '');
  }, [open, area]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={area ? 'Đổi tên khu vực' : 'Thêm khu vực'}
      width="max-w-sm"
      footer={
      <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
          disabled={!name.trim()}
          onClick={() => {
            const id = area?.id ?? `AREA-${Date.now().toString(36)}`;
            saveArea({ id, name: name.trim() });
            onSaved(id);
            onClose();
          }}>
          
            Lưu
          </Button>
        </>
      }>
      
      <Field label="Tên khu vực">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="vd: Tầng 2, Ban công…"
          className={inputClass}
          autoFocus />
        
      </Field>
    </Modal>);

}
