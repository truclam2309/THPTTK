import { useMemo, useState } from 'react';
import { Card, PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { accounts } from '../data/seed';
import type { Account, Role } from '../types';

const ROLES: Role[] = ['Admin','Quản lý','Nhân viên kho','Phục vụ','Bếp','Thu ngân','Kế toán'];
const SINGLETON_ROLES: Role[] = ['Admin','Quản lý','Kế toán'];
export const ADMIN_ACCOUNT_KEY='bepkho.admin.accounts';
const KEY=ADMIN_ACCOUNT_KEY;
const ACCOUNT_MIGRATION_KEY='bepkho.admin.accounts.realNames.v1';
const LEGACY_USERNAMES: Record<string,string>={admin:'nguyenducanh',quanly:'nguyenminhquan',bep:'lethanhdat',phucvu:'phamthuha',thungan:'vongoclan',kho:'tranvankhoa',ketoan:'nguyenthutrang'};
export const normalizeLoginName=(value:string)=>value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLocaleLowerCase('vi').replace(/[^a-z0-9]/g,'');
function keepSinglePrivilegedRoles(rows: Account[]): Account[] {
  const seen = new Set<Role>();
  return rows.filter((account) => {
    if (!SINGLETON_ROLES.includes(account.role)) return true;
    if (seen.has(account.role)) return false;
    seen.add(account.role);
    return true;
  });
}
export function readAdminAccounts(): Account[] {
  try {
    const stored=JSON.parse(localStorage.getItem(KEY)||'null') as Account[]|null;
    if(!stored)return accounts;
    if(localStorage.getItem(ACCOUNT_MIGRATION_KEY)==='1') {
      const normalized=keepSinglePrivilegedRoles(stored);
      if(normalized.length!==stored.length)localStorage.setItem(KEY,JSON.stringify(normalized));
      return normalized;
    }
    const migrated=stored.map(account=>({...account,username:LEGACY_USERNAMES[account.username]??account.username}));
    const merged=[...accounts];
    migrated.forEach(account=>{const index=merged.findIndex(row=>row.username===account.username);if(index>=0)merged[index]=account;else merged.push(account);});
    const normalized=keepSinglePrivilegedRoles(merged);
    localStorage.setItem(KEY,JSON.stringify(normalized));
    localStorage.setItem(ACCOUNT_MIGRATION_KEY,'1');
    try {const locked=JSON.parse(localStorage.getItem('bepkho.admin.locked')||'[]') as string[];localStorage.setItem('bepkho.admin.locked',JSON.stringify(locked.map(name=>LEGACY_USERNAMES[name]??name)));}catch{/* optional lock migration */}
    return normalized;
  } catch { return accounts; }
}
function audit(event: Record<string,string>) { try { const rows=JSON.parse(localStorage.getItem('bepkho.loginHistory')||'[]'); rows.unshift({...event,id:`LOGIN-${Date.now()}`}); localStorage.setItem('bepkho.loginHistory',JSON.stringify(rows.slice(0,2000))); } catch { /* local demo storage */ } }

export function AdminAccounts() {
  const { user }=useAuth(); const [rows,setRows]=useState<Account[]>(readAdminAccounts); const [query,setQuery]=useState(''); const [role,setRole]=useState(''); const [draft,setDraft]=useState<Account|null>(null); const [err,setErr]=useState(''); const [deleting,setDeleting]=useState<Account|null>(null); const [locked,setLocked]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('bepkho.admin.locked')||'[]')}catch{return[]}});
  const persist=(next:Account[])=>{setRows(next);localStorage.setItem(KEY,JSON.stringify(next));};
  const filtered=useMemo(()=>rows.filter(a=>(!query||`${a.name} ${a.username}`.toLowerCase().includes(query.toLowerCase()))&&(!role||a.role===role)),[rows,query,role]);
  return <div className="px-6 py-6"><PageHeader title="Tài khoản nhân viên" subtitle="Tài khoản demo được lưu trên trình duyệt này; mật khẩu không hiển thị trong danh sách." action={<Button onClick={()=>{setErr('');setDraft({username:'',password:'',name:'',role:'Nhân viên kho'});}}>Tạo tài khoản</Button>} />
  <Card><div className="flex flex-wrap gap-3 border-b border-slate-100 p-4"><input className={inputClass+' max-w-sm'} placeholder="Tìm tên hoặc tên đăng nhập" value={query} onChange={e=>setQuery(e.target.value)}/><select className={inputClass+' max-w-xs'} value={role} onChange={e=>setRole(e.target.value)}><option value="">Tất cả vai trò</option>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-sm"><thead><tr className="border-b text-left text-xs text-slate-500"><th className="px-5 py-3">Nhân viên</th><th className="px-5 py-3">Tên đăng nhập</th><th className="px-5 py-3">Mật khẩu</th><th className="px-5 py-3">Vai trò</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(a=><tr key={a.username}><td className="px-5 py-3">{a.name}</td><td className="px-5 py-3">{a.username}</td><td className="px-5 py-3">••••••••</td><td className="px-5 py-3">{a.role}</td><td className="px-5 py-3">{locked.includes(a.username)?'Đã khóa':'Hoạt động'}</td><td className="px-5 py-3"><div className="flex gap-2"><Button variant="secondary" onClick={()=>{setErr('');setDraft({...a});}}>Sửa</Button><Button variant="secondary" disabled={a.username===user?.username} onClick={()=>{const next=locked.includes(a.username)?locked.filter(x=>x!==a.username):[...locked,a.username];setLocked(next);localStorage.setItem('bepkho.admin.locked',JSON.stringify(next));}}>{locked.includes(a.username)?'Mở khóa':'Khóa'}</Button><Button variant="danger" disabled={a.username===user?.username} onClick={()=>setDeleting(a)}>Xóa</Button></div></td></tr>)}</tbody></table></div></Card>
  <ConfirmDialog open={!!deleting} title="Xác nhận xóa tài khoản" message={deleting&&<>Bạn có chắc muốn xóa <strong>{deleting.name} ({deleting.username})</strong>?</>} confirmLabel="Xác nhận xóa" onClose={()=>setDeleting(null)} onConfirm={()=>{if(deleting)persist(rows.filter(x=>x.username!==deleting.username));setDeleting(null);}} />
  <Modal open={!!draft} onClose={()=>setDraft(null)} title={draft?.username?'Chỉnh sửa tài khoản':'Tạo tài khoản'} footer={<><Button variant="secondary" onClick={()=>setDraft(null)}>Hủy</Button><Button onClick={()=>{if(!draft)return;const editing=rows.find(a=>a.username===draft.username);if(editing){if(SINGLETON_ROLES.includes(draft.role)&&rows.some(a=>a.username!==editing.username&&a.role===draft.role)){setErr(`Đã có một tài khoản ${draft.role}.`);return;}persist(rows.map(a=>a.username===editing.username?{...a,role:draft.role}:a));setDraft(null);return;}const username=draft.username.trim().toLowerCase();if(!username||!draft.name.trim()||!draft.password){setErr('Nhập tên, tài khoản và mật khẩu cho tài khoản mới.');return;}if(rows.some(a=>a.username===username)){setErr('Tên đăng nhập đã tồn tại.');return;}if(SINGLETON_ROLES.includes(draft.role)&&rows.some(a=>a.role===draft.role)){setErr(`Đã có một tài khoản ${draft.role}.`);return;}persist([...rows,{...draft,username}]);setDraft(null);}}>Lưu</Button></>}>
    {draft&&<div className="space-y-3">{rows.some(a=>a.username===draft.username)?<Field label="Vai trò"><select className={inputClass} value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value as Role})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></Field>:<><Field label="Họ và tên"><input className={inputClass} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></Field><Field label="Tên đăng nhập"><input className={inputClass} value={draft.username} onChange={e=>setDraft({...draft,username:e.target.value})}/></Field><Field label="Mật khẩu"><input className={inputClass} type="password" value={draft.password} onChange={e=>setDraft({...draft,password:e.target.value})}/></Field><Field label="Vai trò"><select className={inputClass} value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value as Role})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></Field></>}{err&&<p className="text-sm text-red-600">{err}</p>}</div>}
  </Modal></div>;
}

export function LoginHistory() {
  const [rows]=useState<Record<string,string>[]>(()=>{try{return JSON.parse(localStorage.getItem('bepkho.loginHistory')||'[]')}catch{return[]}}); const [query,setQuery]=useState('');
  return <div className="px-6 py-6"><PageHeader title="Lịch sử đăng nhập" subtitle="Phiên làm việc được ghi nhận trên trình duyệt hiện tại."/><Card><div className="border-b border-slate-100 p-4"><input className={inputClass+' max-w-sm'} placeholder="Tìm tài khoản, nhân viên hoặc trạng thái" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-slate-500"><th className="px-5 py-3">Nhân viên / tài khoản</th><th className="px-5 py-3">Bộ phận</th><th className="px-5 py-3">Đăng nhập</th><th className="px-5 py-3">Đăng xuất</th><th className="px-5 py-3">Trạng thái</th></tr></thead><tbody>{rows.filter(r=>`${r.username} ${r.name} ${r.status}`.toLowerCase().includes(query.toLowerCase())).map((r,i)=><tr key={i} className="border-b"><td className="px-5 py-3">{r.name||r.username}<div className="text-xs text-slate-400">{r.employeeId||r.username}</div></td><td className="px-5 py-3">{r.department||r.role||'—'}</td><td className="px-5 py-3">{r.at?new Date(r.at).toLocaleString('vi-VN'):'—'}</td><td className="px-5 py-3">{r.logoutAt?new Date(r.logoutAt).toLocaleString('vi-VN'):'Chưa đăng xuất'}</td><td className="px-5 py-3">{r.status}</td></tr>)}{!rows.length&&<tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Chưa có lịch sử đăng nhập trong trình duyệt này.</td></tr>}</tbody></table></div></Card></div>;
}

export { audit as recordDemoLogin };
