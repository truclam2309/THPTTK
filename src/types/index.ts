export type Unit = 'kg' | 'g' | 'lít' | 'ml' | 'lon' | 'quả' | 'chai' | 'gói' | 'hộp' | 'thùng';

export type IngredientGroup =
'Thịt' |
'Hải sản' |
'Rau củ' |
'Gia vị' |
'Đồ uống' |
'Đồ khô';

export interface Ingredient {
  id: string;
  /** Mã danh mục duy nhất; dữ liệu cũ dùng id làm mã dự phòng. */
  code?: string;
  name: string;
  unit: Unit;
  group: IngredientGroup;
  minStock: number;
  /** Giá vốn tham chiếu / đơn vị */
  refCost: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export type BatchState = 'FRESH' | 'NEAR_EXPIRY' | 'EXPIRED' | 'CANCELLED';

export interface Batch {
  id: string;
  ingredientId: string;
  barcode: string;
  supplierId: string;
  /** Số lượng còn lại */
  quantity: number;
  initialQuantity: number;
  receivedAt: string;
  mfgDate: string;
  expiryDate: string;
  unitCost: number;
  cancelled?: boolean;
  cancelReason?: string;
  cancelNote?: string;
  cancelledAt?: string;
  note?: string;
}

export type DishCategory =
'Món chính' |
'Khai vị' |
'Hải sản' |
'Thịt' |
'Rau' |
'Đồ uống';

export interface RecipeItem {
  ingredientId: string;
  /** theo đơn vị gốc của nguyên liệu */
  qty: number;
}

export interface Dish {
  id: string;
  name: string;
  price: number;
  category: DishCategory;
  image: string;
  recipe: RecipeItem[];
  /** Món có sẵn (nước, bánh tráng…) — không qua bếp, chuyển thẳng thu ngân */
  readyMade?: boolean;
  /** Sản phẩm kho tương ứng với món bán trực tiếp; không phải công thức chế biến. */
  stockIngredientId?: string;
  special?: boolean;
  specialReason?: string;
}

export interface Area {
  id: string;
  name: string;
}

export interface DiningTable {
  id: string;
  name: string;
  areaId: string;
  seats: number;
}

/**
 * DRAFT: phục vụ đang soạn, chưa gửi
 * PENDING: đã gửi bếp, chờ nhận
 * COOKING: bếp đang chế biến
 * READY: đã xong / món có sẵn — chờ thu ngân
 */

/**
 * DRAFT: phục vụ đang soạn, chưa gửi
 * PENDING: đã gửi bếp, chờ nhận
 * COOKING: bếp đang chế biến
 * READY: đã xong / món có sẵn — chờ thu ngân
 * CANCELLED: món đã hủy
 */
export type LineStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'COOKING'
  | 'CASHIER_PENDING'
  | 'READY'
  | 'CANCELLED';



export interface OrderLine {
  lineId: string;
  dishId: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
  status: LineStatus;
  sentAt?: string;
  startedAt?: string;
  readyAt?: string;

  // Thông tin lịch sử hủy món
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  cancelNote?: string;
  cancelledQty?: number;
  cancellationHistory?: CancellationRecord[];
}

export interface CancellationRecord {
  qty: number;
  reason: string;
  note?: string;
  cancelledBy: string;
  cancelledAt: string;
}


export type OrderStatus = 'OPEN' | 'PAID';

export type PaymentMethod = 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ';

export interface Order {
  id: string;
  /** Đánh dấu chứng từ được tạo từ seed demo, không phải giao dịch thực tế. */
  demo?: boolean;
  tableId: string;
  lines: OrderLine[];
  status: OrderStatus;
  createdAt: string;
  createdBy: string;
  paidAt?: string;
  paidBy?: string;
  paymentMethod?: PaymentMethod;
  cashReceived?: number;
  subtotal: number;
  discountRate: number;
  discount: number;
  vat: number;
  total: number;
  /** giá vốn nguyên liệu ghi nhận khi thanh toán */
  cost?: number;
}

export type TxType =
'NHẬP KHO' |
'XUẤT KHO' |
'BÁN HÀNG' |
'HỦY' |
'HAO HỤT' |
'ĐIỀU CHỈNH';

export interface StockTx {
  id: string;
  at: string;
  type: TxType;
  batchId: string;
  ingredientId: string;
  qty: number;
  unit: Unit;
  user: string;
  reason: string;
  value: number;
}

export interface DailyStat {
  date: string;
  revenue: number;
  cost: number;
}

export type ReportKind = 'REVENUE' | 'STOCK_BALANCE';

export interface ReportRecord {
  id: string;
  kind: ReportKind;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  createdBy: string;
  createdByRole: Role;
  recipient: 'Quản lý';
  metrics: Record<string, number>;
  stockLines?: ReportStockLine[];
}

export interface ReportStockLine {
  productId: string;
  productCode: string;
  productName: string;
  unit: Unit;
  openingQty: number;
  receivedQty: number;
  issuedQty: number;
  disposedQty: number;
  wasteQty: number;
  adjustmentInQty: number;
  adjustmentOutQty: number;
  closingQty: number;
  closingValue: number;
  countedQty?: number;
  varianceQty?: number;
}

export type Role = 'Admin' | 'Quản lý' | 'Nhân viên kho' | 'Phục vụ' | 'Bếp' | 'Thu ngân' | 'Kế toán';

export type PurchaseRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED' | 'MANAGER_APPROVED' | 'ACCOUNTING_PENDING' | 'ACCOUNTING_RECEIVED' | 'COMPLETED' | 'DRAFT';
export interface PurchaseRequestLine { ingredientId: string; quantity: number; unitCost: number; }
export interface PurchaseApprovalEvent {
  id: string; actor: string; at: string; from: PurchaseRequestStatus;
  to: PurchaseRequestStatus; action: string; reason?: string;
}
export interface PurchaseRequest {
  id: string; requestedAt: string; requester: string; department: string;
  lines: PurchaseRequestLine[]; reason: string; note?: string;
  status: PurchaseRequestStatus; history: PurchaseApprovalEvent[];
}

export interface StocktakeRecord {
  id: string; createdAt: string; createdBy: string; department: string;
  lines: { ingredientId: string; bookQty: number; countedQty: number; goodQty?: number; poorQty?: number; lostQty?: number; note?: string }[];
  note: string; status: 'DRAFT'|'PENDING_MANAGER' | 'REVIEWED'; history: { actor: string; at: string; action: string; note?: string }[];
}

export interface CashierShift {
  id: string; cashier: string; openedAt: string; openingCash: number; note?: string;
  status: 'OPEN'|'CLOSED'|'ACCOUNTING_RECEIVED'|'REVIEW'; closedAt?: string;
  cashSales?: number; transferSales?: number; otherSales?: number; otherIncome?: number;
  cashExpense?: number; expectedCash?: number; actualCash?: number; variance?: number; varianceReason?: string;
  accountingNote?: string;
}

export type CashVoucherType = 'RECEIPT' | 'PAYMENT';
export type CashVoucherMethod = 'Tiền mặt' | 'Chuyển khoản';
export type CashVoucherPartyType = 'Khách hàng' | 'Nhà cung cấp' | 'Nhân viên' | 'Khác';
export interface CashVoucher {
  id: string;
  type: CashVoucherType;
  date: string;
  partyType: CashVoucherPartyType;
  partyName: string;
  category: string;
  reason: string;
  description: string;
  amount: number;
  method: CashVoucherMethod;
  bankAccount?: string;
  attachment?: string;
  accountingTreatment: 'INCOME' | 'EXPENSE' | 'CASH_ONLY';
  createdBy: string;
  createdAt: string;
  status: 'Đã xác nhận';
  demo?: boolean;
}

export interface CashLedger {
  vouchers: CashVoucher[];
  openingCash: number;
  openingBank: number;
  bankAccountName: string;
  closedPeriods: string[];
}

export interface Account {
  username: string;
  password: string;
  name: string;
  role: Role;
}
