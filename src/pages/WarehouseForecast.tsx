import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, PageHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useApp } from '../contexts/AppContext';
import { availableQty } from '../utils/inventory';
import { formatQty, formatVnd } from '../utils/format';
import type { Unit } from '../types';

const DAYS=7;
const BUFFER=1.2;
const REQUISITION_DRAFT_KEY='bepkho.purchaseRequestDraft';
const localDate=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

type ForecastRow={ingredientId:string;name:string;unit:Unit;paidUsage:number;forecast:number;stock:number;quantity:number;unitCost:number;supplierId:string;}

export function WarehouseForecast(){
  const {orders,dishes,ingredients,batches,suppliers}=useApp();
  const navigate=useNavigate();
  const [quantities,setQuantities]=useState<Record<string,string>>({});
  const [supplierIds,setSupplierIds]=useState<Record<string,string>>({});
  const [message,setMessage]=useState('');
  const now=new Date();
  const from=new Date(now);from.setDate(from.getDate()-(DAYS-1));from.setHours(0,0,0,0);
  const forecastDate=new Date(now);forecastDate.setDate(forecastDate.getDate()+1);
  const paidOrders=orders.filter(order=>order.status==='PAID'&&!!order.paidAt&&new Date(order.paidAt)>=from&&new Date(order.paidAt)<=now);

  const allForecast=useMemo(()=>{
    const usage=new Map<string,number>();
    paidOrders.forEach(order=>order.lines.forEach(line=>{
      const dish=dishes.find(item=>item.id===line.dishId);
      const qty=Math.max(0,line.qty-(line.cancelledQty??0));
      if(!dish||qty===0)return;
      if(dish.readyMade&&dish.stockIngredientId){usage.set(dish.stockIngredientId,(usage.get(dish.stockIngredientId)??0)+qty);return;}
      dish.recipe.forEach(recipe=>usage.set(recipe.ingredientId,(usage.get(recipe.ingredientId)??0)+recipe.qty*qty));
    }));
    return ingredients.map(ingredient=>{
      const paidUsage=usage.get(ingredient.id)??0;
      const forecast=paidUsage/DAYS*BUFFER;
      const stock=availableQty(batches,ingredient.id,now);
      const desired=forecast+ingredient.minStock;
      const quantity=Math.max(0,Math.ceil((desired-stock)*1000)/1000);
      const latestBatch=batches.filter(batch=>batch.ingredientId===ingredient.id&&batch.supplierId&&!batch.cancelled).sort((a,b)=>b.receivedAt.localeCompare(a.receivedAt))[0];
      const supplierByGroup:Record<string,string>={'Thịt':'SUP-01','Hải sản':'SUP-02','Rau củ':'SUP-03','Gia vị':'SUP-04','Đồ uống':'SUP-04','Đồ khô':'SUP-04'};
      const supplierId=latestBatch?.supplierId??supplierByGroup[ingredient.group]??suppliers[0]?.id??'';
      const unitCost=latestBatch?.unitCost??ingredient.refCost;
      return {ingredientId:ingredient.id,name:ingredient.name,unit:ingredient.unit,paidUsage,forecast,stock,quantity,unitCost,supplierId};
    });
  },[paidOrders,dishes,ingredients,batches,suppliers,now]);
  const suggestions=allForecast.filter(row=>row.quantity>0);
  const createDraft=(row:ForecastRow)=>{
    const quantity=Number(quantities[row.ingredientId]??row.quantity);
    if(!Number.isFinite(quantity)||quantity<=0){setMessage(`Số lượng đề xuất cho ${row.name} phải lớn hơn 0.`);return;}
    const supplierId=supplierIds[row.ingredientId]??row.supplierId;
    const lines=[{ingredientId:row.ingredientId,unit:row.unit,quantity,unitCost:row.unitCost,supplierId}];
    const selectedSuppliers=[supplierId].filter(Boolean);
    const supplierSummary=selectedSuppliers.map(id=>suppliers.find(item=>item.id===id)?.name??id).join(', ');
    const period=`${localDate(from)} đến ${localDate(now)}`;
    localStorage.setItem(REQUISITION_DRAFT_KEY,JSON.stringify({lines,reason:`Đề xuất nhập bổ sung theo dự báo ngày ${localDate(forecastDate)}`,note:`Dự báo từ ${paidOrders.length} bill đã thanh toán trong ${period}; dùng trung bình 7 ngày và cộng 20% dự phòng. Nhà cung cấp gợi ý: ${supplierSummary}. Kho đã xác nhận đề xuất.`}));
    setMessage(`Đã xác nhận đề xuất ${row.name}. Phiếu đề nghị nhập kho đã được điền sẵn.`);
    navigate('/warehouse/requests');
  };

  return <div className="px-6 py-6">
    <PageHeader title="Dự báo & đề xuất nhập hàng" subtitle={`Dự báo nhu cầu nguyên liệu cho ngày ${new Date(forecastDate).toLocaleDateString('vi-VN')}`} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat label="Bill đã thanh toán" value={String(paidOrders.length)} note={`Trong ${DAYS} ngày gần nhất`} /><Stat label="Nguyên liệu cần bổ sung" value={String(suggestions.length)} note="So với dự báo + tồn an toàn" /><Stat label="Tỷ lệ dự phòng" value="20%" note="Trên mức dùng bình quân/ngày" /></div>
    <Card className="mb-5 overflow-hidden"><div className="border-b border-slate-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">Dự báo quy đổi món trên bill đã thanh toán qua công thức món; món bán sẵn quy đổi trực tiếp sang sản phẩm kho. Mức đề nghị = nhu cầu ngày mai + tồn tối thiểu − tồn khả dụng.</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-sm"><thead><tr className="border-b text-left text-xs text-slate-500"><th className="p-3">Nguyên liệu</th><th>Đã dùng từ bill</th><th>Dự báo ngày mai</th><th>Tồn khả dụng</th><th>Đề xuất nhập</th><th>Nhà cung cấp gợi ý</th><th>Đơn giá</th><th>Trạng thái / thao tác</th></tr></thead><tbody>{allForecast.map(row=>{const needsOrder=row.quantity>0;const displayQty=quantities[row.ingredientId]??String(row.quantity);const supplierId=supplierIds[row.ingredientId]??row.supplierId;return <tr key={row.ingredientId} className="border-b"><td className="p-3 font-medium">{row.name} <span className="text-xs text-slate-500">({row.unit})</span></td><td>{formatQty(row.paidUsage,row.unit)}</td><td>{formatQty(row.forecast,row.unit)}</td><td>{formatQty(row.stock,row.unit)}</td><td>{needsOrder?<input type="number" min="0.001" step="0.001" className="w-28 rounded-lg border border-slate-200 px-2 py-1.5" value={displayQty} onChange={event=>setQuantities({...quantities,[row.ingredientId]:event.target.value})} />:'—'}</td><td>{needsOrder?<select className="max-w-56 rounded-lg border border-slate-200 px-2 py-1.5" value={supplierId} onChange={event=>setSupplierIds({...supplierIds,[row.ingredientId]:event.target.value})}>{suppliers.map(supplier=><option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>:'—'}</td><td>{needsOrder?formatVnd(row.unitCost):'—'}</td><td>{needsOrder?<div className="flex items-center gap-2"><Badge tone="amber" dot>Cần bổ sung</Badge><Button size="sm" onClick={()=>createDraft(row)}>Xác nhận & điền phiếu</Button></div>:<Badge tone="green">Đủ dự kiến</Badge>}</td></tr>;})}{!allForecast.length&&<tr><td colSpan={8} className="p-8 text-center text-slate-500">Chưa có dữ liệu nguyên liệu để dự báo.</td></tr>}</tbody></table></div>
      <div className="border-t border-slate-100 p-4"><p className="text-xs text-slate-500">Mỗi nguyên liệu cần bổ sung có nút riêng; xác nhận sẽ điền riêng sản phẩm đó vào phiếu đề nghị nhập.</p></div>
    </Card>
    {message&&<p role="status" className="text-sm text-brand-700">{message}</p>}
    <p className="mt-4 text-xs text-slate-400">Mô hình dự báo demo chạy trên dữ liệu bill và công thức đang có trong trình duyệt; chưa dùng dịch vụ AI hoặc dữ liệu máy chủ.</p>
  </div>;
}

function Stat({label,value,note}:{label:string;value:string;note:string}){
  return <Card className="p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></Card>;
}
