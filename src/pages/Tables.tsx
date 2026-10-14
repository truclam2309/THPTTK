import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PencilIcon,
  PlusIcon,
  Settings2Icon,
  Trash2Icon,
  UsersIcon } from
'lucide-react';
import { PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableFormModal } from '../components/tables/TableFormModal';
import { AreaFormModal } from '../components/tables/AreaFormModal';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { minutesSince, submittedLines } from '../utils/order';
import type { Area, DiningTable } from '../types';

export function Tables() {
  const { areas, tables, orders, deleteTable, deleteArea, showToast } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isManager = user?.role === 'Quản lý';

  const [areaId, setAreaId] = useState(areas[0]?.id ?? '');
  const [editMode, setEditMode] = useState(false);
  const [tableModal, setTableModal] = useState<{open: boolean;table: DiningTable | null;}>({ open: false, table: null });
  const [areaModal, setAreaModal] = useState<{open: boolean;area: Area | null;}>({ open: false, area: null });
  const [confirmTable, setConfirmTable] = useState<DiningTable | null>(null);
  const [confirmArea, setConfirmArea] = useState<Area | null>(null);

  const currentArea = areas.find((a) => a.id === areaId) ?? areas[0];
  const list = tables.filter((t) => t.areaId === currentArea?.id);

  const openOrder = (tableId: string) =>
  orders.find((o) => o.tableId === tableId && o.status === 'OPEN');

  const busyCount = tables.filter((t) => openOrder(t.id)).length;

  return (
    <div className="px-6 py-6">
      <PageHeader
        title="Sơ đồ bàn"
        subtitle={`${busyCount}/${tables.length} bàn đang có khách`}
        action={
        isManager &&
        <div className="flex gap-2">
              {editMode &&
          <>
                  <Button variant="secondary" onClick={() => setAreaModal({ open: true, area: null })}>
                    <PlusIcon className="h-4 w-4" />
                    Khu vực
                  </Button>
                  <Button onClick={() => setTableModal({ open: true, table: null })}>
                    <PlusIcon className="h-4 w-4" />
                    Thêm bàn
                  </Button>
                </>
          }
              <Button
            variant={editMode ? 'primary' : 'secondary'}
            onClick={() => setEditMode((v) => !v)}>
            
                <Settings2Icon className="h-4 w-4" />
                {editMode ? 'Xong chỉnh sửa' : 'Chỉnh sửa sơ đồ'}
              </Button>
            </div>

        } />
      

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {areas.map((a) => {
          const busy = tables.filter((t) => t.areaId === a.id && openOrder(t.id)).length;
          const total = tables.filter((t) => t.areaId === a.id).length;
          return (
            <button
              key={a.id}
              onClick={() => setAreaId(a.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors duration-150 ease-out ${
              currentArea?.id === a.id ?
              'bg-slate-900 text-white' :
              'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`
              }>
              
              {a.name}
              <span className={`tabular text-xs ${currentArea?.id === a.id ? 'text-slate-300' : 'text-slate-400'}`}>
                {busy}/{total}
              </span>
            </button>);

        })}
        {editMode && currentArea &&
        <div className="ml-2 flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setAreaModal({ open: true, area: currentArea })}>
              <PencilIcon className="h-3.5 w-3.5" />
              Đổi tên
            </Button>
            <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmArea(currentArea)}>
              <Trash2Icon className="h-3.5 w-3.5" />
              Xóa khu vực
            </Button>
          </div>
        }
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" /> Trống
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-brand-600" /> Có khách
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        {list.length === 0 ?
        <div className="py-16 text-center">
            <p className="text-sm font-medium text-slate-700">Khu vực chưa có bàn</p>
            {isManager &&
          <Button className="mt-4" onClick={() => {setEditMode(true);setTableModal({ open: true, table: null });}}>
                <PlusIcon className="h-4 w-4" />
                Thêm bàn đầu tiên
              </Button>
          }
          </div> :

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {list.map((t) => {
            const order = openOrder(t.id);
            const busy = !!order;
            const items = order ? submittedLines(order).reduce((s, l) => s + l.qty, 0) : 0;
            return (
              <div key={t.id} className="relative">
                  <button
                  onClick={() =>
                  editMode ? setTableModal({ open: true, table: t }) : navigate(`/order/${t.id}`)
                  }
                  className={`flex aspect-square w-full flex-col justify-between rounded-xl border-2 p-4 text-left transition-colors duration-150 ease-out ${
                  busy ?
                  'border-brand-600 bg-brand-600 text-white hover:bg-brand-700' :
                  'border-dashed border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50'}`
                  }>
                  
                    <div className="flex items-start justify-between">
                      <span className="text-lg font-semibold">{t.name}</span>
                      <span className={`flex items-center gap-1 text-xs ${busy ? 'text-brand-100' : 'text-slate-400'}`}>
                        <UsersIcon className="h-3.5 w-3.5" />
                        {t.seats}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{busy ? 'Có khách' : 'Trống'}</p>
                      <p className={`tabular text-xs ${busy ? 'text-brand-100' : 'text-slate-400'}`}>
                        {busy ?
                      `${minutesSince(order!.createdAt)} phút · ${items} món` :
                      editMode ?
                      'Nhấn để sửa' :
                      'Nhấn để gọi món'}
                      </p>
                    </div>
                  </button>
                  {editMode &&
                <button
                  onClick={() => setConfirmTable(t)}
                  aria-label={`Xóa ${t.name}`}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-red-600 shadow-card hover:bg-red-50">
                  
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </button>
                }
                </div>);

          })}
          </div>
        }
      </div>

      <TableFormModal
        open={tableModal.open}
        table={tableModal.table}
        defaultAreaId={currentArea?.id ?? ''}
        onClose={() => setTableModal({ open: false, table: null })} />
      
      <AreaFormModal
        open={areaModal.open}
        area={areaModal.area}
        onClose={() => setAreaModal({ open: false, area: null })}
        onSaved={(id) => setAreaId(id)} />
      
      <ConfirmDialog
        open={!!confirmTable}
        title="Xóa bàn"
        message={<>Bạn chắc chắn muốn xóa <strong>{confirmTable?.name}</strong> khỏi sơ đồ?</>}
        confirmLabel="Xóa bàn"
        onClose={() => setConfirmTable(null)}
        onConfirm={() => {
          if (!confirmTable) return;
          const err = deleteTable(confirmTable.id);
          showToast(err ?? `Đã xóa ${confirmTable.name}`);
        }} />
      
      <ConfirmDialog
        open={!!confirmArea}
        title="Xóa khu vực"
        message={<>Xóa khu vực <strong>{confirmArea?.name}</strong>? Khu vực phải không còn bàn nào.</>}
        confirmLabel="Xóa khu vực"
        onClose={() => setConfirmArea(null)}
        onConfirm={() => {
          if (!confirmArea) return;
          const err = deleteArea(confirmArea.id);
          if (!err) setAreaId(areas.find((a) => a.id !== confirmArea.id)?.id ?? '');
          showToast(err ?? `Đã xóa khu vực ${confirmArea.name}`);
        }} />
      
    </div>);

}
