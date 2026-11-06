import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState } from
'react';
import type {
  Area,
  Batch,
  DiningTable,
  Dish,
  Ingredient,
  Order,
  OrderLine,
  PaymentMethod,
  PurchaseRequest,
  PurchaseRequestStatus,
  StocktakeRecord,
  CashierShift,
  ReportKind,
  ReportRecord,
  ReportStockLine,
  RecipeItem,
  StockTx,
  Supplier } from
'../types';
import {
  areas as seedAreas,
  baselineDishSold,
  baselineToday,
  batches as seedBatches,
  dailyStats,
  dishes as seedDishes,
  ingredients as seedIngredients,
  initialTx,
  seedOrders,
  suppliers as seedSuppliers,
  tables as seedTables } from
'../data/seed';
import { useAuth } from './AuthContext';
import { deductFefo } from '../utils/fefo';
import { billableQty, isReadyToPay, orderTotals, submittedLines } from '../utils/order';

export interface ReceivePayload {
  ingredientId: string;
  barcode: string;
  supplierId: string;
  quantity: number;
  receivedAt: string;
  mfgDate: string;
  expiryDate: string;
  unitCost: number;
  note?: string;
}

interface AppState {
  ingredients: Ingredient[];
  batches: Batch[];
  dishes: Dish[];
  suppliers: Supplier[];
  orders: Order[];
  transactions: StockTx[];
  purchaseRequests: PurchaseRequest[];
  processPurchaseRequest: (id: string, status: Exclude<PurchaseRequestStatus, 'PENDING'>, reason?: string) => string | null;
  createPurchaseRequest: (request: Omit<PurchaseRequest, 'id'|'requestedAt'|'requester'|'department'|'status'|'history'>) => string | null;
  stocktakes: StocktakeRecord[];
  createStocktake: (record: Omit<StocktakeRecord,'id'|'createdAt'|'createdBy'|'department'|'status'|'history'>) => string | null;
  saveStocktakeDraft: (record: Omit<StocktakeRecord,'id'|'createdAt'|'createdBy'|'department'|'status'|'history'>, id?: string) => string | null;
  cashierShifts: CashierShift[];
  openCashierShift: (openingCash: number, note: string) => string | null;
  closeCashierShift: (shiftId: string, actualCash: number, reason: string, sales: {cash: number;transfer: number;other: number}) => string | null;
  processCashierShift: (shiftId: string, status: 'ACCOUNTING_RECEIVED'|'REVIEW', note: string) => string | null;
  reports: ReportRecord[];
  areas: Area[];
  tables: DiningTable[];
  dailyStats: typeof dailyStats;
  baseline: typeof baselineToday;
  dishSold: Record<string, number>;
  userName: string;
  toast: string | null;
  showToast: (msg: string) => void;
  // Kho
  receiveStock: (p: ReceivePayload) => Batch;
  disposeBatch: (batchId: string, reason: string, note: string) => void;
  recordWaste: (ingredientId: string, qty: number, reason: string) => void;
  saveIngredient: (ingredient: Ingredient) => string | null;
  createReport: (kind: ReportKind, periodStart: string, periodEnd: string, countedStock?: Record<string, number>) => ReportRecord | null;
  // Thực đơn
  toggleSpecial: (dishId: string, reason?: string) => void;
  saveDish: (dish: Dish) => void;
  deleteDish: (dishId: string) => void;
  saveRecipe: (dishId: string, recipe: RecipeItem[]) => void;
  // Sơ đồ bàn
  saveArea: (area: Area) => void;
  deleteArea: (areaId: string) => string | null;
  saveTable: (table: DiningTable) => void;
  deleteTable: (tableId: string) => string | null;
  // Order
  openOrderOf: (tableId: string) => Order | undefined;
  addLine: (tableId: string, dish: Dish) => void;
  updateLine: (orderId: string, lineId: string, patch: Partial<OrderLine>) => void;
  removeLine: (orderId: string, lineId: string) => void;
  submitOrder: (orderId: string) => {kitchen: number;cashier: number;};
  cancelLine: (orderId: string, lineId: string, qty: number, reason: string, note: string) => boolean;
  // Bếp
  startCooking: (orderId: string, lineId: string) => void;
  finishLine: (orderId: string, lineId: string) => void;
  completeDirectSale: (orderId: string, lineId: string) => boolean;
  // Thu ngân
  payOrder: (
  orderId: string,
  opts: {discountRate: number;method: PaymentMethod;cashReceived?: number;})
  => Order | null;
  // Tra cứu
  ingredientOf: (id: string) => Ingredient;
  dishOf: (id: string) => Dish | undefined;
  tableOf: (id: string) => DiningTable | undefined;
}

const Ctx = createContext<AppState | null>(null);

let counter = 100;
const uid = (prefix: string) => `${prefix}-${++counter}`;
let orderSeq = 1055;

export function AppProvider({ children }: {children: React.ReactNode;}) {
  const { user } = useAuth();
  const userName = user?.name ?? 'Hệ thống';
  const hasRole = useCallback((...roles: string[]) => !!user && roles.includes(user.role), [user]);

  const [ingredients, setIngredients] = useState<Ingredient[]>(seedIngredients);
  const [suppliers] = useState<Supplier[]>(seedSuppliers);
  const [batches, setBatches] = useState<Batch[]>(seedBatches);
  const [dishes, setDishes] = useState<Dish[]>(seedDishes);
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [transactions, setTransactions] = useState<StockTx[]>(initialTx);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => {
    try { return JSON.parse(window.localStorage.getItem('bepkho.purchaseRequests') || '[]') as PurchaseRequest[]; }
    catch { return []; }
  });
  const [stocktakes, setStocktakes] = useState<StocktakeRecord[]>(() => { try { return JSON.parse(window.localStorage.getItem('bepkho.stocktakes') || '[]') as StocktakeRecord[]; } catch { return []; } });
  const [cashierShifts,setCashierShifts]=useState<CashierShift[]>(()=>{try{return JSON.parse(window.localStorage.getItem('bepkho.cashierShifts')||'[]') as CashierShift[]}catch{return[]}});
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [areas, setAreas] = useState<Area[]>(seedAreas);
  const [tables, setTables] = useState<DiningTable[]>(seedTables);
  const [dishSold, setDishSold] =
  useState<Record<string, number>>(baselineDishSold);
  const [toast, setToast] = useState<string | null>(null);
  const paymentLocks = useRef(new Set<string>());
  const directSaleLocks = useRef(new Set<string>());
  const cancelledQtyByLine = useRef(new Map<string, number>());

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const processPurchaseRequest = useCallback((id: string, status: Exclude<PurchaseRequestStatus, 'PENDING'>, reason = '') => {
    if (!user) return 'Vui lòng đăng nhập';
    if ((status === 'REJECTED' || status === 'REVISION_REQUESTED') && !reason.trim()) return 'Vui lòng nhập lý do';
    const request = purchaseRequests.find((item) => item.id === id);
    if (!request) return 'Không tìm thấy đề nghị';
    const managerAction = status === 'MANAGER_APPROVED' || (status === 'REJECTED' || status === 'REVISION_REQUESTED') && request.status === 'PENDING';
    if (managerAction && (user.role !== 'Quản lý' || request.requester === user.name)) return 'Chỉ quản lý khác người lập mới được phê duyệt hoặc từ chối phiếu';
    if (!managerAction && user.role !== 'Kế toán') return 'Chỉ kế toán được tiếp nhận và xử lý nghiệp vụ ngân sách';
    if (status === 'ACCOUNTING_PENDING' && request.status !== 'MANAGER_APPROVED') return 'Phiếu phải được quản lý phê duyệt trước';
    if (status === 'COMPLETED' && request.status !== 'ACCOUNTING_PENDING') return 'Kế toán cần tiếp nhận phiếu trước khi hoàn tất';
    if (status === 'APPROVED' && request.status !== 'ACCOUNTING_PENDING') return 'Chỉ tiếp nhận phiếu đã được quản lý phê duyệt';
    if ((status === 'REJECTED' || status === 'REVISION_REQUESTED') && !['PENDING','MANAGER_APPROVED','ACCOUNTING_PENDING'].includes(request.status)) return 'Phiếu không ở trạng thái có thể xử lý';
    if (status === 'REJECTED' && request.requester === user.name && user.role === 'Quản lý') return 'Người lập không được tự phê duyệt phiếu';
    const updated = purchaseRequests.map((item) => item.id !== id ? item : {
      ...item, status, history: [...item.history, {
        id: `AP-${Date.now()}`, actor: user.name, at: new Date().toISOString(),
        from: item.status, to: status,
        action: status === 'MANAGER_APPROVED' ? 'Quản lý phê duyệt' : status === 'ACCOUNTING_PENDING' ? 'Chuyển kế toán xử lý' : status === 'COMPLETED' ? 'Hoàn tất xử lý' : status === 'APPROVED' ? 'Duyệt ngân sách' : status === 'REJECTED' ? 'Từ chối' : 'Yêu cầu chỉnh sửa',
        reason: reason.trim() || undefined
      }]
    });
    setPurchaseRequests(updated);
    window.localStorage.setItem('bepkho.purchaseRequests', JSON.stringify(updated));
    showToast(status === 'MANAGER_APPROVED' ? 'Đã phê duyệt đề nghị và chuyển kế toán' : status === 'REJECTED' ? 'Đã từ chối đề nghị' : status === 'ACCOUNTING_PENDING' ? 'Đã chuyển đề nghị đến kế toán' : status === 'COMPLETED' ? 'Đã hoàn tất đề nghị' : status === 'APPROVED' ? 'Đã duyệt ngân sách đề nghị' : 'Đã gửi yêu cầu chỉnh sửa');
    return null;
  }, [purchaseRequests, user, showToast]);

  const createPurchaseRequest = useCallback((draft: Omit<PurchaseRequest,'id'|'requestedAt'|'requester'|'department'|'status'|'history'>) => {
    if (!user || user.role !== 'Nhân viên kho') return 'Chỉ nhân viên kho được lập đề nghị';
    if (!draft.reason.trim() || !draft.lines.length || draft.lines.some(l => !l.ingredientId || l.quantity <= 0 || l.unitCost < 0)) return 'Vui lòng nhập nội dung và hàng hóa hợp lệ';
    const now = new Date().toISOString(); const request: PurchaseRequest = { ...draft, id: `DN-${Date.now()}`, requestedAt: now, requester: user.name, department: 'Kho', status: 'PENDING', history: [{id:`EV-${Date.now()}`,actor:user.name,at:now,from:'PENDING',to:'PENDING',action:'Gửi đề nghị đến quản lý'}] };
    const next=[request,...purchaseRequests]; setPurchaseRequests(next); window.localStorage.setItem('bepkho.purchaseRequests',JSON.stringify(next)); showToast('Đã gửi đề nghị nhập kho đến quản lý nhà hàng'); return null;
  }, [user,purchaseRequests,showToast]);

  const saveStocktakeDraft = useCallback((draft: Omit<StocktakeRecord,'id'|'createdAt'|'createdBy'|'department'|'status'|'history'>,id?:string) => {
    if(!user||user.role!=='Nhân viên kho')return 'Chỉ nhân viên kho được lưu nháp kiểm kê';const now=new Date().toISOString();const current=id?stocktakes.find(x=>x.id===id&&x.status==='DRAFT'):undefined;const record:StocktakeRecord={...draft,id:current?.id??id??`KK-${Date.now()}`,createdAt:current?.createdAt??now,createdBy:current?.createdBy??user.name,department:'Kho',status:'DRAFT',history:current?.history??[{actor:user.name,at:now,action:'Lưu bản nháp'}]};const next=current?stocktakes.map(x=>x.id===record.id?record:x):[record,...stocktakes];setStocktakes(next);window.localStorage.setItem('bepkho.stocktakes',JSON.stringify(next));showToast('Đã lưu bản nháp kiểm kê');return record.id;
  },[user,stocktakes,showToast]);
  const createStocktake = useCallback((draft: Omit<StocktakeRecord,'id'|'createdAt'|'createdBy'|'department'|'status'|'history'>) => {
    if (!user || user.role !== 'Nhân viên kho') return 'Chỉ nhân viên kho được lập biên bản kiểm kê';
    if (!draft.lines.length || draft.lines.some(l=>l.countedQty<0)) return 'Số lượng kiểm kê không hợp lệ';
    const now=new Date().toISOString(); const record:StocktakeRecord={...draft,id:`KK-${Date.now()}`,createdAt:now,createdBy:user.name,department:'Kho',status:'PENDING_MANAGER',history:[{actor:user.name,at:now,action:'Gửi biên bản đến quản lý'}]};
    const next=[record,...stocktakes]; setStocktakes(next); window.localStorage.setItem('bepkho.stocktakes',JSON.stringify(next)); showToast('Đã gửi biên bản kiểm kê đến quản lý; tồn kho chưa điều chỉnh'); return null;
  },[user,stocktakes,showToast]);

  const openCashierShift=useCallback((openingCash:number,note:string)=>{
    if(!user||user.role!=='Thu ngân')return 'Chỉ thu ngân được mở ca';
    if(!Number.isFinite(openingCash)||openingCash<0)return 'Tiền mặt đầu ca không hợp lệ';
    if(cashierShifts.some(s=>s.cashier===user.name&&s.status==='OPEN'))return 'Bạn đã có ca đang hoạt động';
    const shift:CashierShift={id:`CA-${Date.now()}`,cashier:user.name,openedAt:new Date().toISOString(),openingCash,note:note.trim(),status:'OPEN'};
    const next=[shift,...cashierShifts];setCashierShifts(next);window.localStorage.setItem('bepkho.cashierShifts',JSON.stringify(next));showToast(`Đã mở ca ${shift.id}`);return null;
  },[user,cashierShifts,showToast]);

  const closeCashierShift=useCallback((shiftId:string,actualCash:number,reason:string,sales:{cash:number;transfer:number;other:number})=>{
    if(!user||user.role!=='Thu ngân')return 'Chỉ thu ngân được chốt ca';
    const shift=cashierShifts.find(s=>s.id===shiftId&&s.cashier===user.name&&s.status==='OPEN');if(!shift)return 'Không tìm thấy ca đang mở';
    const expected=shift.openingCash+sales.cash;const variance=actualCash-expected;if(!Number.isFinite(actualCash)||actualCash<0)return 'Tiền kiểm đếm không hợp lệ';if(variance!==0&&!reason.trim())return 'Bắt buộc nhập lý do chênh lệch';
    const next=cashierShifts.map(s=>s.id!==shiftId?s:{...s,status:'CLOSED' as const,closedAt:new Date().toISOString(),cashSales:sales.cash,transferSales:sales.transfer,otherSales:sales.other,expectedCash:expected,actualCash,variance,varianceReason:reason.trim()});setCashierShifts(next);window.localStorage.setItem('bepkho.cashierShifts',JSON.stringify(next));showToast('Đã chốt ca và chuyển báo cáo đến kế toán');return null;
  },[user,cashierShifts,showToast]);

  const processCashierShift=useCallback((shiftId:string,status:'ACCOUNTING_RECEIVED'|'REVIEW',note:string)=>{
    if(!user||user.role!=='Kế toán')return 'Chỉ kế toán được xử lý báo cáo chốt ca';if(status==='REVIEW'&&!note.trim())return 'Nhập ghi chú yêu cầu kiểm tra lại';
    const shift=cashierShifts.find(s=>s.id===shiftId&&s.status!=='OPEN');if(!shift)return 'Không tìm thấy ca đã chốt';const next=cashierShifts.map(s=>s.id===shiftId?{...s,status,accountingNote:note.trim()}:s);setCashierShifts(next);window.localStorage.setItem('bepkho.cashierShifts',JSON.stringify(next));showToast(status==='ACCOUNTING_RECEIVED'?'Đã tiếp nhận báo cáo chốt ca':'Đã yêu cầu kiểm tra lại');return null;
  },[user,cashierShifts,showToast]);

  const ingredientOf = useCallback(
    (id: string) => ingredients.find((i) => i.id === id)!,
    [ingredients]
  );
  const dishOf = useCallback(
    (id: string) => dishes.find((d) => d.id === id),
    [dishes]
  );
  const tableOf = useCallback(
    (id: string) => tables.find((t) => t.id === id),
    [tables]
  );

  /* ---------------- Kho ---------------- */

  const receiveStock = useCallback(
    (p: ReceivePayload) => {
      if (!hasRole('Nhân viên kho')) throw new Error('Chỉ nhân viên kho được nhập hàng');
      if (p.quantity <= 0 || p.unitCost < 0 || !p.ingredientId || !p.supplierId) {
        throw new Error('Thông tin nhập hàng không hợp lệ');
      }
      const code = p.ingredientId.replace('ING-', '');
      const n = batches.filter((b) => b.ingredientId === p.ingredientId).length + 1;
      const id = `LOT-${code}-${String(n).padStart(3, '0')}`;
      const batch: Batch = {
        id,
        ingredientId: p.ingredientId,
        barcode: p.barcode,
        supplierId: p.supplierId,
        quantity: p.quantity,
        initialQuantity: p.quantity,
        receivedAt: p.receivedAt,
        mfgDate: p.mfgDate,
        expiryDate: p.expiryDate,
        unitCost: p.unitCost,
        note: p.note
      };
      setBatches((prev) => [batch, ...prev]);
      setTransactions((prev) => [
      {
        id: uid('TX'),
        at: new Date().toISOString(),
        type: 'NHẬP KHO',
        batchId: id,
        ingredientId: p.ingredientId,
        qty: p.quantity,
        unit: ingredientOf(p.ingredientId).unit,
        user: userName,
        reason: `Nhập từ ${suppliers.find((s) => s.id === p.supplierId)?.name ?? 'NCC'}`,
        value: p.quantity * p.unitCost
      },
      ...prev]
      );
      return batch;
    },
    [batches, ingredientOf, suppliers, userName, hasRole]
  );

  const disposeBatch = useCallback(
    (batchId: string, reason: string, note: string) => {
      if (!hasRole('Nhân viên kho')) return;
      const batch = batches.find((b) => b.id === batchId);
      if (!batch || batch.cancelled || batch.quantity <= 0) return;
      setBatches((prev) =>
      prev.map((b) =>
      b.id === batchId ?
      {
        ...b,
        cancelled: true,
        cancelReason: reason,
        cancelNote: note,
        cancelledAt: new Date().toISOString()
      } :
      b
      )
      );
      setTransactions((prev) => [
      {
        id: uid('TX'),
        at: new Date().toISOString(),
        type: 'HỦY',
        batchId,
        ingredientId: batch.ingredientId,
        qty: batch.quantity,
        unit: ingredientOf(batch.ingredientId).unit,
        user: userName,
        reason: note ? `${reason} — ${note}` : reason,
        value: batch.quantity * batch.unitCost
      },
      ...prev]
      );
      showToast(`Đã hủy lô ${batchId} — ghi nhận chi phí hao hụt`);
    },
    [batches, ingredientOf, showToast, userName, hasRole]
  );

  const recordWaste = useCallback(
    (ingredientId: string, qty: number, reason: string) => {
      if (!hasRole('Nhân viên kho', 'Bếp')) return;
      if (qty <= 0) return;
      const result = deductFefo(
        batches,
        [{ ingredientId, qty, reason }],
        { type: 'HAO HỤT', user: userName, ingredients, makeId: () => uid('TX') }
      );
      if (result.shortages.length) {
        showToast('Tồn kho khả dụng không đủ để ghi nhận hao hụt');
        return;
      }
      setBatches(result.batches);
      setTransactions((prev) => [...result.txs, ...prev]);
      showToast(`Đã ghi nhận hao hụt ${ingredientOf(ingredientId).name}`);
    },
    [batches, ingredients, ingredientOf, showToast, userName, hasRole]
  );

  const saveIngredient = useCallback((ingredient: Ingredient) => {
    if (!hasRole('Nhân viên kho')) return 'Chỉ nhân viên kho được quản lý danh mục sản phẩm';
    const code = (ingredient.code || '').trim();
    const name = ingredient.name.trim();
    if (!code || !name || ingredient.minStock < 0 || ingredient.refCost < 0) return 'Mã, tên sản phẩm, tồn tối thiểu và giá vốn phải hợp lệ';
    const duplicate = ingredients.some((item) => item.id !== ingredient.id && (item.code || item.id).toLowerCase() === code.toLowerCase());
    if (duplicate) return `Mã sản phẩm ${code} đã tồn tại`;
    const normalized = { ...ingredient, code, name };
    setIngredients((prev) => prev.some((item) => item.id === normalized.id) ?
      prev.map((item) => item.id === normalized.id ? normalized : item) : [...prev, normalized]);
    showToast(`Đã lưu sản phẩm ${code}`);
    return null;
  }, [hasRole, ingredients, showToast]);

  const createReport = useCallback((kind: ReportKind, periodStart: string, periodEnd: string, countedStock: Record<string, number> = {}) => {
    const allowed = kind === 'REVENUE' ? hasRole('Thu ngân') : hasRole('Nhân viên kho');
    if (!allowed || !user) {
      showToast(kind === 'REVENUE' ? 'Chỉ thu ngân được lập báo cáo doanh thu' : 'Chỉ nhân viên kho được lập báo cáo cân đối');
      return null;
    }
    if (!periodStart || !periodEnd || periodStart > periodEnd) {
      showToast('Khoảng thời gian báo cáo không hợp lệ');
      return null;
    }

    const inPeriod = (timestamp: string) => timestamp.slice(0, 10) >= periodStart && timestamp.slice(0, 10) <= periodEnd;
    let metrics: Record<string, number>;
    if (kind === 'REVENUE') {
      const paid = orders.filter((order) => order.status === 'PAID' && order.paidAt && inPeriod(order.paidAt));
      metrics = {
        invoiceCount: paid.length,
        orderCount: new Set(paid.map((order) => order.id)).size,
        grossRevenue: paid.reduce((sum, order) => sum + order.subtotal, 0),
        discount: paid.reduce((sum, order) => sum + order.discount, 0),
        vat: paid.reduce((sum, order) => sum + order.vat, 0),
        netRevenue: paid.reduce((sum, order) => sum + order.total, 0),
        cash: paid.filter((order) => order.paymentMethod === 'Tiền mặt').reduce((sum, order) => sum + order.total, 0),
        transfer: paid.filter((order) => order.paymentMethod === 'Chuyển khoản').reduce((sum, order) => sum + order.total, 0),
        card: paid.filter((order) => order.paymentMethod === 'Thẻ').reduce((sum, order) => sum + order.total, 0)
      };
    } else {
      const movements = transactions.filter((tx) => inPeriod(tx.at));
      const stockLines: ReportStockLine[] = ingredients.map((ingredient) => {
        const allItemTx = transactions.filter((tx) => tx.ingredientId === ingredient.id && tx.at.slice(0, 10) <= periodEnd);
        const itemTx = allItemTx.filter((tx) => inPeriod(tx.at));
        const sign = (tx: StockTx) => tx.type === 'NHẬP KHO' ? 1 : tx.type === 'ĐIỀU CHỈNH' && /tăng|thừa|dư/i.test(tx.reason) ? 1 : -1;
        const qtyBefore = allItemTx.filter((tx) => tx.at.slice(0, 10) < periodStart).reduce((sum, tx) => sum + sign(tx) * tx.qty, 0);
        const valueBefore = allItemTx.filter((tx) => tx.at.slice(0, 10) < periodStart).reduce((sum, tx) => sum + sign(tx) * tx.value, 0);
        const sumQty = (predicate: (tx: StockTx) => boolean) => itemTx.filter(predicate).reduce((sum, tx) => sum + tx.qty, 0);
        const sumValue = (predicate: (tx: StockTx) => boolean) => itemTx.filter(predicate).reduce((sum, tx) => sum + tx.value, 0);
        const receivedQty = sumQty((tx) => tx.type === 'NHẬP KHO');
        const issuedQty = sumQty((tx) => tx.type === 'BÁN HÀNG' || tx.type === 'XUẤT KHO');
        const disposedQty = sumQty((tx) => tx.type === 'HỦY');
        const wasteQty = sumQty((tx) => tx.type === 'HAO HỤT');
        const adjustmentInQty = sumQty((tx) => tx.type === 'ĐIỀU CHỈNH' && sign(tx) > 0);
        const adjustmentOutQty = sumQty((tx) => tx.type === 'ĐIỀU CHỈNH' && sign(tx) < 0);
        const openingQty = qtyBefore;
        const closingQty = openingQty + receivedQty - issuedQty - disposedQty - wasteQty + adjustmentInQty - adjustmentOutQty;
        const receivedValue = sumValue((tx) => tx.type === 'NHẬP KHO');
        const issuedValue = sumValue((tx) => tx.type === 'BÁN HÀNG' || tx.type === 'XUẤT KHO');
        const disposedValue = sumValue((tx) => tx.type === 'HỦY');
        const wasteValue = sumValue((tx) => tx.type === 'HAO HỤT');
        const adjustmentInValue = sumValue((tx) => tx.type === 'ĐIỀU CHỈNH' && sign(tx) > 0);
        const adjustmentOutValue = sumValue((tx) => tx.type === 'ĐIỀU CHỈNH' && sign(tx) < 0);
        const closingValue = valueBefore + receivedValue - issuedValue - disposedValue - wasteValue + adjustmentInValue - adjustmentOutValue;
        const countedQty = countedStock[ingredient.id];
        return {
          productId: ingredient.id,
          productCode: ingredient.code || ingredient.id,
          productName: ingredient.name,
          unit: ingredient.unit,
          openingQty,
          receivedQty,
          issuedQty,
          disposedQty,
          wasteQty,
          adjustmentInQty,
          adjustmentOutQty,
          closingQty,
          closingValue,
          countedQty,
          varianceQty: countedQty === undefined ? undefined : countedQty - closingQty
        };
      });
      const valueOfType = (type: StockTx['type']) => movements.filter((tx) => tx.type === type).reduce((sum, tx) => sum + tx.value, 0);
      metrics = {
        receivedValue: valueOfType('NHẬP KHO'),
        issuedValue: valueOfType('BÁN HÀNG') + valueOfType('XUẤT KHO'),
        disposedValue: valueOfType('HỦY'),
        wasteValue: valueOfType('HAO HỤT'),
        closingValue: stockLines.reduce((sum, line) => sum + line.closingValue, 0),
        varianceCount: stockLines.filter((line) => line.varianceQty !== undefined && line.varianceQty !== 0).length,
        transactionCount: movements.length
      };
      const report: ReportRecord = {
        id: uid('STOCK'), kind, periodStart, periodEnd,
        createdAt: new Date().toISOString(), createdBy: user.name,
        createdByRole: user.role, recipient: 'Quản lý', metrics, stockLines
      };
      setReports((prev) => [report, ...prev]);
      showToast('Đã gửi báo cáo cân đối kho đến quản lý');
      return report;
    }

    const report: ReportRecord = {
      id: uid(kind === 'REVENUE' ? 'REV' : 'STOCK'),
      kind,
      periodStart,
      periodEnd,
      createdAt: new Date().toISOString(),
      createdBy: user.name,
      createdByRole: user.role,
      recipient: 'Quản lý',
      metrics
    };
    setReports((prev) => [report, ...prev]);
    showToast(`Đã gửi báo cáo ${kind === 'REVENUE' ? 'doanh thu' : 'cân đối kho'} đến quản lý`);
    return report;
  }, [hasRole, user, showToast, orders, transactions, ingredients]);

  /* ---------------- Thực đơn ---------------- */

  const toggleSpecial = useCallback(
    (dishId: string, reason?: string) => {
      if (!hasRole('Quản lý')) return;
      const dish = dishes.find((d) => d.id === dishId);
      setDishes((prev) =>
      prev.map((d) =>
      d.id === dishId ? { ...d, special: !d.special, specialReason: reason } : d
      )
      );
      showToast(
        dish?.special ?
        `Đã gỡ "${dish?.name}" khỏi món đặc biệt` :
        `"${dish?.name}" đã lên menu Món đặc biệt hôm nay`
      );
    },
    [dishes, showToast, hasRole]
  );

  const saveDish = useCallback(
    (dish: Dish) => {
      if (!hasRole('Quản lý')) return;
      setDishes((prev) =>
      prev.some((d) => d.id === dish.id) ?
      prev.map((d) => d.id === dish.id ? dish : d) :
      [...prev, dish]
      );
      showToast(`Đã lưu món "${dish.name}"`);
    },
    [showToast, hasRole]
  );

  const deleteDish = useCallback(
    (dishId: string) => {
      if (!hasRole('Quản lý')) return;
      const dish = dishes.find((d) => d.id === dishId);
      setDishes((prev) => prev.filter((d) => d.id !== dishId));
      showToast(`Đã xóa món "${dish?.name}"`);
    },
    [dishes, showToast, hasRole]
  );

  const saveRecipe = useCallback(
    (dishId: string, recipe: RecipeItem[]) => {
      if (!hasRole('Quản lý')) return;
      if (dishes.find((dish) => dish.id === dishId)?.readyMade) {
        showToast('Sản phẩm bán trực tiếp không sử dụng công thức chế biến');
        return;
      }
      setDishes((prev) =>
      prev.map((d) => d.id === dishId ? { ...d, recipe } : d)
      );
      showToast('Đã cập nhật công thức');
    },
    [dishes, showToast, hasRole]
  );

  /* ---------------- Sơ đồ bàn ---------------- */

  const saveArea = useCallback((area: Area) => {
    if (!hasRole('Quản lý')) return;
    setAreas((prev) =>
    prev.some((a) => a.id === area.id) ?
    prev.map((a) => a.id === area.id ? area : a) :
    [...prev, area]
    );
  }, [hasRole]);

  const deleteArea = useCallback(
    (areaId: string) => {
      if (!hasRole('Quản lý')) return 'Chỉ quản lý nhà hàng được cấu hình khu vực';
      if (tables.some((t) => t.areaId === areaId))
      return 'Khu vực còn bàn — hãy xóa hoặc chuyển bàn trước';
      setAreas((prev) => prev.filter((a) => a.id !== areaId));
      return null;
    },
    [tables, hasRole]
  );

  const saveTable = useCallback(
    (table: DiningTable) => {
      if (!hasRole('Quản lý', 'Phục vụ')) return;
      setTables((prev) =>
      prev.some((t) => t.id === table.id) ?
      prev.map((t) => t.id === table.id ? table : t) :
      [...prev, table]
      );
      showToast(`Đã lưu ${table.name}`);
    },
    [showToast, hasRole]
  );

  const deleteTable = useCallback(
    (tableId: string) => {
      if (!hasRole('Quản lý', 'Phục vụ')) return 'Không có quyền quản lý bàn';
      if (orders.some((o) => o.tableId === tableId && o.status === 'OPEN'))
      return 'Bàn đang có khách, không thể xóa';
      setTables((prev) => prev.filter((t) => t.id !== tableId));
      return null;
    },
    [orders, hasRole]
  );

  /* ---------------- Order (phục vụ) ---------------- */

  const openOrderOf = useCallback(
    (tableId: string) =>
    orders.find((o) => o.tableId === tableId && o.status === 'OPEN'),
    [orders]
  );

  const addLine = useCallback(
    (tableId: string, dish: Dish) => {
      if (!hasRole('Phục vụ') || !tables.some((t) => t.id === tableId) || !dishes.some((d) => d.id === dish.id)) return;
      setOrders((prev) => {
        const existing = prev.find(
          (o) => o.tableId === tableId && o.status === 'OPEN'
        );
        const newLine: OrderLine = {
          lineId: uid('L'),
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          qty: 1,
          status: 'DRAFT'
        };
        if (!existing) {
          const order: Order = {
            id: `HD-${orderSeq++}`,
            tableId,
            lines: [newLine],
            status: 'OPEN',
            createdAt: new Date().toISOString(),
            createdBy: userName,
            subtotal: 0,
            discountRate: 0,
            discount: 0,
            vat: 0,
            total: 0
          };
          return [order, ...prev];
        }
        return prev.map((o) => {
          if (o.id !== existing.id) return o;
          const draft = o.lines.find(
            (l) => l.dishId === dish.id && l.status === 'DRAFT' && !l.note
          );
          return {
            ...o,
            lines: draft ?
            o.lines.map((l) =>
            l.lineId === draft.lineId ? { ...l, qty: l.qty + 1 } : l
            ) :
            [...o.lines, newLine]
          };
        });
      });
    },
    [userName, hasRole, tables, dishes]
  );

  const updateLine = useCallback(
    (orderId: string, lineId: string, patch: Partial<OrderLine>) => {
      if (!hasRole('Phục vụ')) return;
      setOrders((prev) =>
      prev.map((o) =>
      o.id === orderId && o.status === 'OPEN' ?
      {
        ...o,
        lines: o.lines.map((l) =>
        l.lineId === lineId && l.status === 'DRAFT' ?
          { ...l, ...(patch.qty !== undefined && patch.qty > 0 ? { qty: patch.qty } : {}), ...(patch.note !== undefined ? { note: patch.note } : {}) } : l
        )
      } :
      o
      )
      );
    },
    [hasRole]
  );

  const removeLine = useCallback((orderId: string, lineId: string) => {
    if (!hasRole('Phục vụ')) return;
    setOrders((prev) =>
    prev.
    map((o) =>
      o.id === orderId && o.status === 'OPEN' ?
      { ...o, lines: o.lines.filter((l) => !(l.lineId === lineId && l.status === 'DRAFT')) } :
    o
    ).
    filter((o) => o.status === 'PAID' || o.lines.length > 0)
    );
  }, [hasRole]);

  const submitOrder = useCallback(
    (orderId: string) => {
      if (!hasRole('Phục vụ')) return { kitchen: 0, cashier: 0 };
      const order = orders.find((o) => o.id === orderId);
      let kitchen = 0;
      let cashier = 0;
      if (!order || order.status !== 'OPEN' || !order.lines.some((l) => l.status === 'DRAFT')) return { kitchen, cashier };
      const now = new Date().toISOString();
      const lines = order.lines.map((l) => {
        if (l.status !== 'DRAFT') return l;
        const ready = dishes.find((d) => d.id === l.dishId)?.readyMade;
        if (ready) {
          cashier += l.qty;
          return { ...l, status: 'CASHIER_PENDING' as const, sentAt: now };
        }
        kitchen += l.qty;
        return { ...l, status: 'PENDING' as const, sentAt: now };
      });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, lines } : o));
      return { kitchen, cashier };
    },
    [orders, dishes, hasRole]
  );

  /* ---------------- Bếp ---------------- */

  const startCooking = useCallback(
    (orderId: string, lineId: string) => {
      if (!hasRole('Bếp')) return;
      const order = orders.find((o) => o.id === orderId);
      const line = order?.lines.find((l) => l.lineId === lineId);
      if (!order || order.status !== 'OPEN' || line?.status !== 'PENDING') return;
      setOrders((prev) => prev.map((o) => o.id === orderId ? {
        ...o,
        lines: o.lines.map((l) => l.lineId === lineId && l.status === 'PENDING' ?
          { ...l, status: 'COOKING', startedAt: new Date().toISOString() } : l)
      } : o));
    },
    [orders, hasRole]
  );

  const finishLine = useCallback(
    (orderId: string, lineId: string) => {
      if (!hasRole('Bếp')) return;
      const order = orders.find((o) => o.id === orderId);
      const line = order?.lines.find((l) => l.lineId === lineId);
      if (!order || order.status !== 'OPEN' || line?.status !== 'COOKING') return;
      setOrders((prev) => prev.map((o) => o.id === orderId ? {
        ...o,
        lines: o.lines.map((l) => l.lineId === lineId && l.status === 'COOKING' ?
          { ...l, status: 'READY', readyAt: new Date().toISOString() } : l)
      } : o));
    },
    [orders, hasRole]
  );

  const completeDirectSale = useCallback((orderId: string, lineId: string) => {
    if (!hasRole('Thu ngân')) return false;
    const lockKey = `${orderId}:${lineId}`;
    if (directSaleLocks.current.has(lockKey)) return false;
    const order = orders.find((item) => item.id === orderId);
    const line = order?.lines.find((item) => item.lineId === lineId);
    const dish = line && dishes.find((item) => item.id === line.dishId);
    if (!order || order.status !== 'OPEN' || !line || line.status !== 'CASHIER_PENDING' || !dish?.readyMade) return false;

    directSaleLocks.current.add(lockKey);
    if (dish.stockIngredientId) {
      const result = deductFefo(batches, [{
        ingredientId: dish.stockIngredientId,
        qty: billableQty(line),
        reason: `Xuất sản phẩm có sẵn ${line.name} ×${billableQty(line)} — ${order.id}`
      }], { type: 'BÁN HÀNG', user: userName, ingredients, makeId: () => uid('TX') });
      if (result.shortages.length) {
        directSaleLocks.current.delete(lockKey);
        showToast(`Không đủ tồn khả dụng của ${line.name}; chưa xác nhận hoàn thành`);
        return false;
      }
      setBatches(result.batches);
      setTransactions((prev) => [...result.txs, ...prev]);
    }

    setOrders((prev) => prev.map((item) => item.id !== orderId ? item : {
      ...item,
      lines: item.lines.map((current) => current.lineId === lineId && current.status === 'CASHIER_PENDING' ?
        { ...current, status: 'READY', readyAt: new Date().toISOString() } : current)
    }));
    showToast(`${line.name} đã hoàn thành và sẵn sàng phục vụ`);
    return true;
  }, [hasRole, orders, dishes, batches, ingredients, userName, showToast]);

  const cancelLine = useCallback(
    (orderId: string, lineId: string, qty: number, reason: string, note: string) => {
      if (!hasRole('Bếp') || !Number.isInteger(qty) || qty <= 0 || !reason.trim()) return false;
      const order = orders.find((item) => item.id === orderId);
      const line = order?.lines.find((item) => item.lineId === lineId);
      if (!order || order.status !== 'OPEN' || !line || !['PENDING', 'COOKING'].includes(line.status)) return false;
      const key = `${orderId}:${lineId}`;
      const alreadyCancelled = Math.max(line.cancelledQty ?? 0, cancelledQtyByLine.current.get(key) ?? 0);
      const remaining = Math.max(0, line.qty - alreadyCancelled);
      if (qty > remaining) return false;
      const totalCancelled = alreadyCancelled + qty;
      cancelledQtyByLine.current.set(key, totalCancelled);

      const cancelledAt = new Date().toISOString();
      setOrders((prev) => prev.map((item) => item.id !== orderId ? item : {
        ...item,
        lines: item.lines.map((current) => current.lineId !== lineId ? current : {
          ...current,
          status: totalCancelled >= current.qty ? 'CANCELLED' : current.status,
          cancelledQty: totalCancelled,
          cancelledAt,
          cancelledBy: userName,
          cancelReason: reason.trim(),
          cancelNote: note.trim() || undefined,
          cancellationHistory: [...(current.cancellationHistory ?? []), {
            qty,
            reason: reason.trim(),
            note: note.trim() || undefined,
            cancelledBy: userName,
            cancelledAt
          }]
        })
      }));
      showToast(`Đã ghi nhận hủy ${qty} × ${line.name}`);
      return true;
    },
    [orders, hasRole, userName, showToast]
  );

  /* ---------------- Thu ngân ---------------- */

  const payOrder = useCallback(
    (
    orderId: string,
    opts: {discountRate: number;method: PaymentMethod;cashReceived?: number;}) =>
    {
      if (!hasRole('Thu ngân')) return null;
      if (!cashierShifts.some((shift) => shift.cashier === userName && shift.status === 'OPEN')) { showToast('Mở ca thu ngân trước khi thanh toán'); return null; }
      const order = orders.find((o) => o.id === orderId);
      if (!order || order.status !== 'OPEN' || paymentLocks.current.has(orderId) || !isReadyToPay(order)) return null;
      if (opts.discountRate < 0 || opts.discountRate > 15) return null;
      const lines = submittedLines(order);
      const totals = orderTotals(lines, opts.discountRate);
      if (opts.method === 'Tiền mặt' && (opts.cashReceived ?? 0) < totals.total) return null;

      const needs = lines.flatMap((l) => {
        const dish = dishes.find((d) => d.id === l.dishId);
        if (dish?.readyMade) return [];
        return (dish?.recipe ?? []).map((r) => ({
          ingredientId: r.ingredientId,
          qty: r.qty * billableQty(l),
          reason: `${l.name} ×${billableQty(l)} — ${order.id}`
        }));
      });
      const result = deductFefo(batches, needs, {
        type: 'BÁN HÀNG',
        user: userName,
        ingredients,
        makeId: () => uid('TX')
      });
      if (result.shortages.length) {
        showToast('Không đủ nguyên liệu còn hạn để thanh toán; chưa ghi nhận giao dịch');
        return null;
      }
      paymentLocks.current.add(orderId);

      const paidOrder: Order = {
        ...order,
        lines,
        status: 'PAID',
        paidAt: new Date().toISOString(),
        paidBy: userName,
        paymentMethod: opts.method,
        cashReceived: opts.cashReceived,
        discountRate: opts.discountRate,
        ...totals,
        cost: result.cost
      };

      setBatches(result.batches);
      setTransactions((prev) => [...result.txs, ...prev]);
      setDishSold((prev) => {
        const next = { ...prev };
        lines.forEach((l) => {
          next[l.dishId] = (next[l.dishId] ?? 0) + billableQty(l);
        });
        return next;
      });
      setOrders((prev) => prev.map((o) => o.id === orderId ? paidOrder : o));
      return paidOrder;
    },
    [orders, dishes, batches, ingredients, userName, hasRole, showToast, cashierShifts]
  );

  const value = useMemo<AppState>(
    () => ({
      ingredients, batches, dishes, suppliers, orders, transactions, purchaseRequests, processPurchaseRequest, createPurchaseRequest, stocktakes, createStocktake, saveStocktakeDraft, cashierShifts, openCashierShift, closeCashierShift, processCashierShift, reports, areas, tables,
      dailyStats, baseline: baselineToday, dishSold, userName, toast, showToast,
      receiveStock, disposeBatch, recordWaste, saveIngredient, createReport, toggleSpecial, saveDish, deleteDish,
      saveRecipe, saveArea, deleteArea, saveTable, deleteTable, openOrderOf, addLine,
      updateLine, removeLine, submitOrder, startCooking, finishLine, completeDirectSale, cancelLine, payOrder,
      ingredientOf, dishOf, tableOf
    }),
    [
    ingredients, batches, dishes, suppliers, orders, transactions, purchaseRequests, processPurchaseRequest, createPurchaseRequest, stocktakes, createStocktake, saveStocktakeDraft, cashierShifts, openCashierShift, closeCashierShift, processCashierShift, reports, areas, tables,
    dishSold, userName, toast, showToast, receiveStock, disposeBatch, recordWaste, saveIngredient, createReport,
    toggleSpecial, saveDish, deleteDish, saveRecipe, saveArea, deleteArea, saveTable,
    deleteTable, openOrderOf, addLine, updateLine, removeLine, submitOrder,
    startCooking, finishLine, completeDirectSale, cancelLine, payOrder, ingredientOf, dishOf, tableOf]

  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
