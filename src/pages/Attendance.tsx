import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { formatVnd } from '../utils/format';
import { accounts } from '../data/seed';
import type { Account, PayrollLine, PayrollRecord } from '../types';

type AttendanceSession = { id:string; username:string; name:string; employeeId:string; department:string; role:string; at:string; logoutAt?:string; status:string; adjustmentReason?:string; method?:'CARD'|'APP'; demo?:boolean };
type Monthly = { month:string; status:'DRAFT'|'CONFIRMED'|'SENT' };
const PAYROLL_KEY = 'bepkho.payroll';
const ATTENDANCE_KEY = 'bepkho.attendanceCards';
const DEMO_KEY = 'bepkho.attendanceDemo.v1';

function readStored<T>(key:string, fallback:T):T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; }
  catch { return fallback; }
}

function createAttendanceDemo():AttendanceSession[] {
  const now = new Date();
  const staff = accounts.filter(account => account.role !== 'Admin');
  const demo:AttendanceSession[] = [];
  for (let offset=2; offset>=0; offset-=1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth()-offset, 1);
    const lastDay = offset === 0 ? now.getDate() : new Date(monthDate.getFullYear(), monthDate.getMonth()+1, 0).getDate();
    for (let day=1; day<=lastDay; day+=1) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      if (date.getDay()===0 || date.getDay()===6) continue;
      staff.forEach((account,index) => {
        if ((day+index*3)%19===0) return;
        const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 8+(index%3), (index*7)%60);
        const end = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 17+(index%2), (index*11)%60);
        demo.push({id:`DEMO-ATT-${account.username}-${monthDate.getFullYear()}${String(monthDate.getMonth()+1).padStart(2,'0')}${String(day).padStart(2,'0')}`,username:account.username,name:account.name,employeeId:account.username,department:account.role,role:account.role,at:start.toISOString(),logoutAt:end.toISOString(),status:'Thành công',method:'CARD',demo:true});
      });
    }
  }
  localStorage.setItem(DEMO_KEY,JSON.stringify(demo));
  return demo;
}

function readAttendanceDemo():AttendanceSession[] {
  const saved=readStored<AttendanceSession[]>(DEMO_KEY,[]);
  if(!saved.length)return createAttendanceDemo();
  const complete=saved.map(row=>row.logoutAt?row:{...row,logoutAt:new Date(Date.parse(row.at)+9*60*60*1000).toISOString()});
  if(complete.some((row,index)=>row.logoutAt!==saved[index].logoutAt))localStorage.setItem(DEMO_KEY,JSON.stringify(complete));
  return complete;
}

export function Attendance() {
  const {user}=useAuth();
  const navigate=useNavigate();
  const [rows,setRows]=useState<AttendanceSession[]>(()=>readStored('bepkho.loginHistory',[]));
  const [cardRows,setCardRows]=useState<AttendanceSession[]>(()=>readStored(ATTENDANCE_KEY,[]));
  const [demoRows]=useState<AttendanceSession[]>(readAttendanceDemo);
  const [query,setQuery]=useState('');
  const [department,setDepartment]=useState('');
  const [day,setDay]=useState('');
  const [month,setMonth]=useState(new Date().toISOString().slice(0,7));
  const [editing,setEditing]=useState<AttendanceSession|null>(null);
  const [reason,setReason]=useState('');
  const [cardCode,setCardCode]=useState('');
  const [cardMessage,setCardMessage]=useState('');
  const [payrollRates,setPayrollRates]=useState<Record<string,number>>(()=>readStored('bepkho.payrollRates',{}));
  const [payrollError,setPayrollError]=useState('');
  const [monthly,setMonthly]=useState<Monthly[]>(()=>readStored('bepkho.monthlyAttendance',[]));

  const allRows=[...rows,...cardRows,...demoRows];
  const filtered=useMemo(()=>allRows.filter(r=>r.status==='Thành công'&&(!query||`${r.name} ${r.employeeId}`.toLowerCase().includes(query.toLowerCase()))&&(!department||r.department===department)&&(!day||r.at.slice(0,10)===day)),[rows,cardRows,demoRows,query,department,day]);
  const monthRows=allRows.filter(r=>r.status==='Thành công'&&r.at.slice(0,7)===month);
  const summary=Object.values(monthRows.reduce<Record<string,PayrollLine & {missing:number;days:Set<string>}>>((acc,r)=>{
    const line=acc[r.username]??{username:r.username,name:r.name,department:r.department,workDays:0,hours:0,ratePerDay:payrollRates[r.username]??0,amount:0,missing:0,days:new Set<string>()};
    if(!line.days.has(r.at.slice(0,10))){line.days.add(r.at.slice(0,10));line.workDays+=1;}
    if(r.logoutAt)line.hours+=Math.max(0,(Date.parse(r.logoutAt)-Date.parse(r.at))/3600000);else line.missing+=1;
    line.ratePerDay=payrollRates[r.username]??0;line.amount=line.workDays*line.ratePerDay;acc[r.username]=line;return acc;
  },{}));
  const monthTotals=Object.values(allRows.filter(r=>r.status==='Thành công').reduce<Record<string,{month:string;people:Set<string>;days:Set<string>;hours:number}>>((acc,r)=>{
    const key=r.at.slice(0,7);const entry=acc[key]??{month:key,people:new Set<string>(),days:new Set<string>(),hours:0};
    entry.people.add(r.username);entry.days.add(`${r.username}:${r.at.slice(0,10)}`);
    if(r.logoutAt)entry.hours+=Math.max(0,(Date.parse(r.logoutAt)-Date.parse(r.at))/3600000);
    acc[key]=entry;return acc;
  },{})).sort((a,b)=>b.month.localeCompare(a.month));
  const existingPayroll=readStored<PayrollRecord[]>(PAYROLL_KEY,[]).find(row=>row.month===month);

  const swipeCard=()=>{
    const code=cardCode.trim().toLowerCase();
    if(!code){setCardMessage('Quẹt thẻ hoặc nhập mã thẻ nhân viên trước.');return;}
    const profiles=readStored<Record<string,{employeeId?:string;cardId?:string;department?:string}>>('bepkho.staffProfiles',{});
    const storedAccounts=readStored<Account[]>('bepkho.admin.accounts',accounts);
    const employee=storedAccounts.find(account=>account.username.toLowerCase()===code||account.name.trim().toLowerCase()===code||profiles[account.username]?.employeeId?.toLowerCase()===code||profiles[account.username]?.cardId?.toLowerCase()===code);
    if(!employee){setCardMessage('Không tìm thấy nhân viên theo mã thẻ này. Mã demo mặc định là tên đăng nhập nhân viên.');return;}
    const now=new Date();const today=now.toISOString().slice(0,10);
    const active=cardRows.find(row=>row.username===employee.username&&!row.logoutAt&&row.at.slice(0,10)===today);
    let next:AttendanceSession[];
    if(active){next=cardRows.map(row=>row.id===active.id?{...row,logoutAt:now.toISOString()}:row);setCardMessage(`${employee.name} đã quẹt thẻ ra lúc ${now.toLocaleTimeString('vi-VN')}.`);}
    else {const profile=profiles[employee.username];const record:AttendanceSession={id:`CARD-${employee.username}-${now.getTime()}`,username:employee.username,name:employee.name,employeeId:profile?.employeeId??employee.username,department:profile?.department??employee.role,role:employee.role,at:now.toISOString(),status:'Thành công',method:'CARD'};next=[record,...cardRows];setCardMessage(`${employee.name} đã quẹt thẻ vào lúc ${now.toLocaleTimeString('vi-VN')}.`);}
    setCardRows(next);localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(next));setCardCode('');
  };
  const saveAdjustment=(logoutAt?:string)=>{
    if(!editing||!reason.trim()||editing.demo)return;
    const patch=(r:AttendanceSession)=>r.id===editing.id?{...r,logoutAt,adjustmentReason:reason.trim(),adjustedBy:user?.name,adjustedAt:new Date().toISOString()}:r;
    if(editing.method==='CARD'){const next=cardRows.map(patch);setCardRows(next);localStorage.setItem(ATTENDANCE_KEY,JSON.stringify(next));}
    else {const next=rows.map(patch);setRows(next);localStorage.setItem('bepkho.loginHistory',JSON.stringify(next));}
    setEditing(null);setReason('');
  };
  const setMonthlyStatus=(status:Monthly['status'])=>{const next=[...monthly.filter(x=>x.month!==month),{month,status}];setMonthly(next);localStorage.setItem('bepkho.monthlyAttendance',JSON.stringify(next));};
  const updateRate=(username:string,value:string)=>{const next={...payrollRates,[username]:Number(value)||0};setPayrollRates(next);localStorage.setItem('bepkho.payrollRates',JSON.stringify(next));};
  const generatePayroll=()=>{
    setPayrollError('');
    if(!summary.length){setPayrollError('Tháng này chưa có dữ liệu công để lập bảng lương.');return;}
    if(summary.some(line=>!Number.isFinite(line.ratePerDay)||line.ratePerDay<=0)){setPayrollError('Nhập mức lương mỗi công lớn hơn 0 cho tất cả nhân viên trước khi lập bảng.');return;}
    const all=readStored<PayrollRecord[]>(PAYROLL_KEY,[]);const current=all.find(row=>row.month===month);
    if(current?.status==='ACCOUNTANT_APPROVED'){setPayrollError('Bảng lương tháng này đã được kế toán duyệt, không thể lập lại.');return;}
    const lines:PayrollLine[]=summary.map(({username,name,department,workDays,hours,ratePerDay,amount})=>({username,name,department,workDays,hours,ratePerDay,amount}));
    const record:PayrollRecord={id:current?.id??`BL-${month.replace('-','')}`,month,createdAt:new Date().toISOString(),createdBy:user?.name??'Quản lý',lines,total:lines.reduce((sum,line)=>sum+line.amount,0),status:'PENDING_ACCOUNTING'};
    const next=current?all.map(row=>row.month===month?record:row):[record,...all];localStorage.setItem(PAYROLL_KEY,JSON.stringify(next));setMonthlyStatus('SENT');navigate('/manager/payroll');
  };

  return <div className="px-6 py-6">
    <PageHeader title="Quản lý chấm công" subtitle="Chấm công bằng thẻ ra vào; có thể dùng đầu đọc thẻ nhập mã và gửi Enter." />
    <Card className="mb-5 p-4"><form className="flex flex-wrap items-end gap-3" onSubmit={event=>{event.preventDefault();swipeCard();}}><Field label="Quẹt thẻ / mã thẻ nhân viên"><input autoFocus className={inputClass+' min-w-64'} value={cardCode} onChange={event=>setCardCode(event.target.value)} placeholder="Đầu đọc thẻ hoặc mã đăng nhập" /></Field><Button type="submit">Ghi nhận vào / ra</Button><p className="basis-full text-xs text-slate-500">Mỗi lần quẹt ghi giờ vào hoặc giờ ra luân phiên. Mã demo mặc định là tên đăng nhập nhân viên.</p>{cardMessage&&<p role="status" className="basis-full text-sm text-brand-700">{cardMessage}</p>}</form></Card>
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Dữ liệu demo bên dưới gồm ba tháng gần nhất và được gắn nhãn riêng. Bản demo lưu dữ liệu trên trình duyệt; cần đầu đọc tương thích kiểu bàn phím để đọc thẻ trực tiếp.</div>
    <Card className="mb-5"><div className="grid gap-3 border-b p-4 md:grid-cols-4"><input className={inputClass} placeholder="Tìm nhân viên / mã NV" value={query} onChange={e=>setQuery(e.target.value)} /><select className={inputClass} value={department} onChange={e=>setDepartment(e.target.value)}><option value="">Tất cả bộ phận</option>{[...new Set(allRows.map(r=>r.department).filter(Boolean))].map(x=><option key={x}>{x}</option>)}</select><input className={inputClass} type="date" value={day} onChange={e=>setDay(e.target.value)} /><input className={inputClass} type="month" value={month} onChange={e=>setMonth(e.target.value)} /></div><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-sm"><thead><tr className="border-b text-left text-xs text-slate-500"><th className="p-3">Nhân viên / mã</th><th>Bộ phận</th><th>Ngày</th><th>Giờ vào</th><th>Giờ ra</th><th>Tổng giờ</th><th>Ghi nhận</th><th>Trạng thái</th><th /></tr></thead><tbody>{filtered.map(r=>{const hours=r.logoutAt?Math.max(0,(Date.parse(r.logoutAt)-Date.parse(r.at))/3600000):null;return <tr className="border-b" key={r.id}><td className="p-3">{r.name}<div>{r.employeeId}</div></td><td>{r.department}</td><td>{r.at.slice(0,10)}</td><td>{new Date(r.at).toLocaleTimeString('vi-VN')}</td><td>{r.logoutAt?new Date(r.logoutAt).toLocaleTimeString('vi-VN'):'Chưa quẹt thẻ ra'}</td><td>{hours===null?'—':hours.toFixed(2)}</td><td>{r.demo?'Demo':r.method==='CARD'?'Thẻ':'Phiên ứng dụng'}</td><td>{hours===null?'Thiếu giờ ra':'Đã kết thúc'}</td><td>{!r.demo&&<Button size="sm" variant="secondary" onClick={()=>{setEditing(r);setReason('');}}>Điều chỉnh</Button>}</td></tr>;})}{!filtered.length&&<tr><td colSpan={9} className="p-8 text-center text-slate-400">Không có phiên chấm công phù hợp.</td></tr>}</tbody></table></div></Card>
    <Card className="mb-5 overflow-hidden"><div className="border-b p-4"><h2 className="font-semibold">Tổng hợp công theo tháng · dữ liệu demo</h2><p className="text-xs text-slate-500">Ba tháng gần nhất, số công được tính theo ngày có phiên vào; tổng giờ tính theo phiên đã quẹt ra.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="border-b text-left text-xs text-slate-500"><th className="p-3">Tháng</th><th>Nhân viên</th><th>Tổng công</th><th>Tổng giờ</th></tr></thead><tbody>{monthTotals.map(item=><tr key={item.month} className="border-b"><td className="p-3">{item.month}</td><td>{item.people.size}</td><td>{item.days.size}</td><td>{item.hours.toFixed(1)}</td></tr>)}</tbody></table></div></Card>
    <Card className="mb-5 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="font-semibold">Bảng tổng hợp công · {month}</h2><p className="text-xs text-slate-500">Ngày công là số ngày có ít nhất một phiên vào; lương = ngày công × mức lương mỗi công.</p></div><Button variant="secondary" onClick={()=>setMonthlyStatus('CONFIRMED')}>Xác nhận bảng công</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b text-left text-xs text-slate-500"><th className="p-3">Nhân viên</th><th>Bộ phận</th><th>Ngày công</th><th>Tổng giờ</th><th>Lương / công</th><th>Dự tính lương</th><th>Phiên thiếu giờ ra</th></tr></thead><tbody>{summary.map(line=><tr key={line.username} className="border-b"><td className="p-3">{line.name}</td><td>{line.department}</td><td>{line.workDays}</td><td>{line.hours.toFixed(2)}</td><td><input className={`${inputClass} max-w-40`} type="number" min="0" value={payrollRates[line.username]??''} onChange={event=>updateRate(line.username,event.target.value)} /></td><td className="font-semibold">{formatVnd(line.amount)}</td><td>{line.missing}</td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 p-4"><span className="text-sm">Trạng thái: {monthly.find(x=>x.month===month)?.status==='SENT'?'Đã gửi kế toán':monthly.find(x=>x.month===month)?.status==='CONFIRMED'?'Đã xác nhận':'Đang tổng hợp'}{existingPayroll&&` · Bảng lương: ${existingPayroll.status==='ACCOUNTANT_APPROVED'?'Đã duyệt':existingPayroll.status==='REVISION_REQUESTED'?'Cần rà soát':'Chờ kế toán kiểm tra'}`}</span><Button onClick={generatePayroll}>{existingPayroll?.status==='REVISION_REQUESTED'?'Gửi lại bảng lương':'Xác nhận công và lập bảng lương'}</Button></div>{payrollError&&<p className="px-4 pb-4 text-sm text-red-600">{payrollError}</p>}</Card>
    <ModalAdjust open={!!editing} row={editing} reason={reason} setReason={setReason} onClose={()=>setEditing(null)} onSave={saveAdjustment} />
  </div>;
}

function ModalAdjust({open,row,reason,setReason,onClose,onSave}:{open:boolean;row:AttendanceSession|null;reason:string;setReason:(s:string)=>void;onClose:()=>void;onSave:(logoutAt?:string)=>void}) {
  const [logoutAt,setLogoutAt]=useState(row?.logoutAt?.slice(0,16)??'');
  if(!open||!row)return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-5"><h2 className="text-lg font-semibold">Điều chỉnh phiên chấm công</h2><p className="my-2 text-sm">{row.name} · {new Date(row.at).toLocaleString('vi-VN')}</p><Field label="Giờ ra mới (để trống nếu chưa quẹt thẻ ra)"><input className={inputClass} type="datetime-local" value={logoutAt} onChange={e=>setLogoutAt(e.target.value)} /></Field><Field label="Lý do bắt buộc"><textarea className={inputClass+' mt-2'} value={reason} onChange={e=>setReason(e.target.value)} /></Field><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Hủy</Button><Button onClick={()=>onSave(logoutAt?new Date(logoutAt).toISOString():undefined)}>Lưu</Button></div></div></div>;
}
