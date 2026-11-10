import { useMemo, useState } from 'react';
import { Card, PageHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { useApp } from '../contexts/AppContext';
import { formatDateTime, formatVnd } from '../utils/format';
import type { Customer } from '../types';

type CustomerDraft={name:string;phone:string;email:string;address:string};
const emptyDraft:CustomerDraft={name:'',phone:'',email:'',address:''};
const phoneKey=(value:string)=>value.replace(/\D/g,'');

export function Customers(){
  const {customers,orders,saveCustomer}=useApp();
  const [query,setQuery]=useState('');
  const [editing,setEditing]=useState<Customer|null>(null);
  const [draft,setDraft]=useState<CustomerDraft>(emptyDraft);
  const [error,setError]=useState('');
  const rows=useMemo(()=>customers.filter(customer=>[customer.name,customer.phone,customer.email??'',customer.address??''].join(' ').toLowerCase().includes(query.toLowerCase())).map(customer=>{const bills=orders.filter(order=>phoneKey(order.customerPhone??'')===phoneKey(customer.phone));return {...customer,billCount:bills.length,total:bills.reduce((sum,order)=>sum+order.total,0),lastOrder:bills.sort((a,b)=>(b.paidAt??'').localeCompare(a.paidAt??''))[0]?.paidAt};}),[customers,orders,query]);
  const reset=()=>{setEditing(null);setDraft(emptyDraft);setError('');};
  const submit=()=>{const result=saveCustomer({...draft,id:editing?.id||undefined,createdAt:editing?.id?editing.createdAt:undefined});if(result){setError(result);return;}reset();};
  const edit=(customer:Customer)=>{setEditing(customer);setDraft({name:customer.name,phone:customer.phone,email:customer.email??'',address:customer.address??''});setError('');};
  return <div className="mx-auto max-w-7xl px-5 py-6"><PageHeader title="Quản lý khách hàng" subtitle="Lưu thông tin liên hệ và xem lịch sử mua hàng theo số điện thoại." action={<Button variant="secondary" onClick={()=>{if(editing)reset();else{setEditing({id:'',name:'',phone:'',createdAt:''});setDraft(emptyDraft);setError('');}}}>{editing?'Đóng biểu mẫu':'Thêm khách hàng'}</Button>}/>
    {editing&&<Card className="mb-5 p-5"><h2 className="mb-4 font-semibold">{editing.id?'Cập nhật khách hàng':'Thêm khách hàng mới'}</h2><div className="grid gap-3 sm:grid-cols-2"><Field label="Tên khách hàng *"><input className={inputClass} value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})} placeholder="Họ tên"/></Field><Field label="Số điện thoại *"><input className={inputClass} value={draft.phone} onChange={event=>setDraft({...draft,phone:event.target.value})} placeholder="Số điện thoại liên hệ"/></Field><Field label="Email"><input className={inputClass} type="email" value={draft.email} onChange={event=>setDraft({...draft,email:event.target.value})} placeholder="Không bắt buộc"/></Field><Field label="Địa chỉ"><input className={inputClass} value={draft.address} onChange={event=>setDraft({...draft,address:event.target.value})} placeholder="Không bắt buộc"/></Field></div>{error&&<p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}<div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={reset}>Hủy</Button><Button onClick={submit}>Lưu khách hàng</Button></div></Card>}
    <Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="font-semibold">Danh sách khách hàng</h2><p className="text-xs text-slate-500">{customers.length} hồ sơ · số điện thoại là thông tin tra cứu chính</p></div><input className={inputClass+' max-w-sm'} value={query} onChange={event=>setQuery(event.target.value)} placeholder="Tìm tên, số điện thoại, email"/></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500"><th className="p-3">Khách hàng</th><th>Số điện thoại</th><th>Email / địa chỉ</th><th>Số bill</th><th>Tổng mua</th><th>Lần mua gần nhất</th><th/></tr></thead><tbody>{rows.map(customer=><tr key={customer.id} className="border-b"><td className="p-3 font-medium">{customer.name}</td><td>{customer.phone}</td><td>{customer.email??'—'}<div className="text-xs text-slate-500">{customer.address??''}</div></td><td>{customer.billCount}</td><td>{formatVnd(customer.total)}</td><td>{customer.lastOrder?formatDateTime(customer.lastOrder):'—'}</td><td><Button size="sm" variant="secondary" onClick={()=>edit(customer)}>Sửa</Button></td></tr>)}{!rows.length&&<tr><td colSpan={7} className="p-8 text-center text-slate-400">{customers.length?'Không tìm thấy khách hàng phù hợp.':'Chưa có khách hàng. Hồ sơ sẽ được lưu khi thêm tại đây hoặc khi thanh toán bill.'}</td></tr>}</tbody></table></div></Card>
  </div>;
}
