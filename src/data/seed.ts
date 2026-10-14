import type {
  Account,
  Area,
  Batch,
  DailyStat,
  DiningTable,
  Dish,
  Ingredient,
  Order,
  OrderLine,
  StockTx,
  Supplier } from
'../types';

const DAY = 86_400_000;

function iso(offsetDays: number, hour = 8, minute = 0): string {
  const d = new Date(Date.now() + offsetDays * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const suppliers: Supplier[] = [
{
  id: 'SUP-01',
  name: 'Thực phẩm Tân Bình',
  phone: '0903 112 445',
  address: '12 Cộng Hòa, Q. Tân Bình, TP.HCM'
},
{
  id: 'SUP-02',
  name: 'Hải sản Cần Giờ',
  phone: '0987 220 118',
  address: 'Cảng Cần Giờ, TP.HCM'
},
{
  id: 'SUP-03',
  name: 'Rau sạch Đà Lạt',
  phone: '0911 556 007',
  address: '45 Nguyên Tử Lực, Đà Lạt'
},
{
  id: 'SUP-04',
  name: 'Gia vị Minh Phát',
  phone: '0938 771 900',
  address: '210 Lý Thường Kiệt, Q.10, TP.HCM'
}];


export const ingredients: Ingredient[] = [
{ id: 'ING-BO', code: '8935001100011', name: 'Thịt bò ba chỉ', unit: 'kg', group: 'Thịt', minStock: 5, refCost: 280_000 },
{ id: 'ING-TOM', code: '8935001200028', name: 'Tôm sú tươi', unit: 'kg', group: 'Hải sản', minStock: 4, refCost: 350_000 },
{ id: 'ING-XL', code: '8935001300035', name: 'Rau xà lách', unit: 'kg', group: 'Rau củ', minStock: 2, refCost: 45_000 },
{ id: 'ING-CC', code: '8935001300042', name: 'Cà chua', unit: 'kg', group: 'Rau củ', minStock: 3, refCost: 30_000 },
{ id: 'ING-HT', code: '8935001300059', name: 'Hành tây', unit: 'kg', group: 'Rau củ', minStock: 3, refCost: 25_000 },
{ id: 'ING-NAM', code: '8935001300066', name: 'Nấm kim châm', unit: 'kg', group: 'Rau củ', minStock: 2, refCost: 60_000 },
{ id: 'ING-SOT', code: '8935001400073', name: 'Sốt ướp BBQ', unit: 'kg', group: 'Gia vị', minStock: 1, refCost: 120_000 },
{ id: 'ING-GV', code: '8935001400080', name: 'Gia vị tổng hợp', unit: 'kg', group: 'Gia vị', minStock: 1, refCost: 90_000 },
{ id: 'ING-NN', code: '8935001500097', name: 'Nước ngọt lon', unit: 'lon', group: 'Đồ uống', minStock: 24, refCost: 8_000 },
{ id: 'ING-NS', code: '8935001500103', name: 'Nước suối chai', unit: 'chai', group: 'Đồ uống', minStock: 24, refCost: 4_500 },
{ id: 'ING-BT', code: '8935001600110', name: 'Bánh tráng mè', unit: 'gói', group: 'Đồ khô', minStock: 10, refCost: 9_000 }];


export const batches: Batch[] = [
{
  id: 'LOT-BO-001', ingredientId: 'ING-BO', barcode: '8935001100011', supplierId: 'SUP-01',
  quantity: 20, initialQuantity: 20, receivedAt: iso(-1, 7, 30), mfgDate: iso(-2),
  expiryDate: iso(2), unitCost: 275_000, note: 'Hàng tươi giao buổi sáng'
},
{
  id: 'LOT-BO-002', ingredientId: 'ING-BO', barcode: '8935001100011', supplierId: 'SUP-01',
  quantity: 15, initialQuantity: 15, receivedAt: iso(0, 6, 45), mfgDate: iso(0),
  expiryDate: iso(7), unitCost: 282_000
},
{
  id: 'LOT-TOM-001', ingredientId: 'ING-TOM', barcode: '8935001200028', supplierId: 'SUP-02',
  quantity: 10, initialQuantity: 10, receivedAt: iso(0, 6, 10), mfgDate: iso(0),
  expiryDate: iso(1), unitCost: 348_000, note: 'Tôm sống, ưu tiên dùng trước'
},
{
  id: 'LOT-TOM-002', ingredientId: 'ING-TOM', barcode: '8935001200028', supplierId: 'SUP-02',
  quantity: 6, initialQuantity: 8, receivedAt: iso(-1, 6, 20), mfgDate: iso(-1),
  expiryDate: iso(5), unitCost: 352_000
},
{
  id: 'LOT-XL-001', ingredientId: 'ING-XL', barcode: '8935001300035', supplierId: 'SUP-03',
  quantity: 5, initialQuantity: 6, receivedAt: iso(-1, 8), mfgDate: iso(-2),
  expiryDate: iso(4), unitCost: 44_000
},
{
  id: 'LOT-XL-002', ingredientId: 'ING-XL', barcode: '8935001300035', supplierId: 'SUP-03',
  quantity: 2, initialQuantity: 4, receivedAt: iso(-6, 8), mfgDate: iso(-7),
  expiryDate: iso(-2), unitCost: 43_000
},
{
  id: 'LOT-CC-001', ingredientId: 'ING-CC', barcode: '8935001300042', supplierId: 'SUP-03',
  quantity: 10, initialQuantity: 12, receivedAt: iso(-2, 8), mfgDate: iso(-3),
  expiryDate: iso(5), unitCost: 29_000
},
{
  id: 'LOT-CC-002', ingredientId: 'ING-CC', barcode: '8935001300042', supplierId: 'SUP-03',
  quantity: 4, initialQuantity: 4, receivedAt: iso(-8, 8), mfgDate: iso(-9),
  expiryDate: iso(-3), unitCost: 28_000, cancelled: true, cancelReason: 'Hư hỏng',
  cancelNote: 'Dập nát trong quá trình vận chuyển', cancelledAt: iso(-3, 17)
},
{
  id: 'LOT-HT-001', ingredientId: 'ING-HT', barcode: '8935001300059', supplierId: 'SUP-03',
  quantity: 8, initialQuantity: 10, receivedAt: iso(-4, 8), mfgDate: iso(-5),
  expiryDate: iso(12), unitCost: 24_000
},
{
  id: 'LOT-NAM-001', ingredientId: 'ING-NAM', barcode: '8935001300066', supplierId: 'SUP-03',
  quantity: 3, initialQuantity: 4, receivedAt: iso(-5, 8), mfgDate: iso(-6),
  expiryDate: iso(-1), unitCost: 58_000
},
{
  id: 'LOT-SOT-001', ingredientId: 'ING-SOT', barcode: '8935001400073', supplierId: 'SUP-04',
  quantity: 4, initialQuantity: 5, receivedAt: iso(-10, 9), mfgDate: iso(-20),
  expiryDate: iso(20), unitCost: 118_000
},
{
  id: 'LOT-GV-001', ingredientId: 'ING-GV', barcode: '8935001400080', supplierId: 'SUP-04',
  quantity: 3, initialQuantity: 3, receivedAt: iso(-10, 9), mfgDate: iso(-25),
  expiryDate: iso(40), unitCost: 88_000
},
{
  id: 'LOT-NN-001', ingredientId: 'ING-NN', barcode: '8935001500097', supplierId: 'SUP-04',
  quantity: 120, initialQuantity: 144, receivedAt: iso(-12, 9), mfgDate: iso(-40),
  expiryDate: iso(90), unitCost: 7_600
},
{
  id: 'LOT-NS-001', ingredientId: 'ING-NS', barcode: '8935001500103', supplierId: 'SUP-04',
  quantity: 96, initialQuantity: 120, receivedAt: iso(-9, 9), mfgDate: iso(-30),
  expiryDate: iso(180), unitCost: 4_300
},
{
  id: 'LOT-BT-001', ingredientId: 'ING-BT', barcode: '8935001600110', supplierId: 'SUP-04',
  quantity: 40, initialQuantity: 50, receivedAt: iso(-7, 9), mfgDate: iso(-20),
  expiryDate: iso(60), unitCost: 8_800
}];


const IMG = {
  boNuong: "/912c3b36-3ea3-4c79-b9c2-6cb768edd683.jpg",
  boLucLac: "/5444371a-23a9-48e3-96b8-21fd4eb5001e.jpg",
  boCuonRau: "/dee9fe6b-1a8b-4c56-8ac2-df002ec9d3cf.jpg",
  lauBo: "/2bbcaae5-e9ae-4d34-95d5-4b8b63c0b2a5.jpg",
  tomNuong: "/86a99017-3ef3-4bc9-b68f-4c51c7195119.jpg",
  tomHap: "/e217ddeb-aed9-4743-b63f-90280f41a9bb.jpg",
  salad: "/82287cc7-6ffb-4761-8299-63dd8cbb6630.jpg",
  supHanh: "/01e43c33-1856-44d8-be52-ccc56fd027e5.jpg",
  nuocNgot: "/45779982-9bfb-452d-b40f-84ae5f68f038.jpg",
  namXao: "/40ef96c6-da68-4d05-87ee-31fe9258b767.jpg",
  banhTrang: "/83191911-58aa-4299-a313-6929d180b19d.jpg",
  nuocSuoi: "/67559022-2569-4b4c-84ed-a8bb25513679.jpg"
};

export const dishes: Dish[] = [
{
  id: 'DISH-01', name: 'Bò ba chỉ nướng', price: 150_000, category: 'Thịt', image: IMG.boNuong,
  recipe: [
  { ingredientId: 'ING-BO', qty: 0.2 },
  { ingredientId: 'ING-XL', qty: 0.1 },
  { ingredientId: 'ING-SOT', qty: 0.03 },
  { ingredientId: 'ING-GV', qty: 0.01 }]

},
{
  id: 'DISH-02', name: 'Bò lúc lắc', price: 185_000, category: 'Món chính', image: IMG.boLucLac,
  recipe: [
  { ingredientId: 'ING-BO', qty: 0.22 },
  { ingredientId: 'ING-HT', qty: 0.08 },
  { ingredientId: 'ING-CC', qty: 0.06 },
  { ingredientId: 'ING-GV', qty: 0.01 }]

},
{
  id: 'DISH-03', name: 'Bò cuộn rau', price: 165_000, category: 'Thịt', image: IMG.boCuonRau,
  recipe: [
  { ingredientId: 'ING-BO', qty: 0.18 },
  { ingredientId: 'ING-XL', qty: 0.12 },
  { ingredientId: 'ING-SOT', qty: 0.02 }]

},
{
  id: 'DISH-04', name: 'Lẩu bò', price: 320_000, category: 'Món chính', image: IMG.lauBo,
  recipe: [
  { ingredientId: 'ING-BO', qty: 0.4 },
  { ingredientId: 'ING-NAM', qty: 0.15 },
  { ingredientId: 'ING-CC', qty: 0.12 },
  { ingredientId: 'ING-HT', qty: 0.1 },
  { ingredientId: 'ING-GV', qty: 0.02 }]

},
{
  id: 'DISH-05', name: 'Tôm nướng muối ớt', price: 220_000, category: 'Hải sản', image: IMG.tomNuong,
  recipe: [
  { ingredientId: 'ING-TOM', qty: 0.25 },
  { ingredientId: 'ING-GV', qty: 0.02 },
  { ingredientId: 'ING-XL', qty: 0.05 }]

},
{
  id: 'DISH-06', name: 'Tôm hấp bia', price: 240_000, category: 'Hải sản', image: IMG.tomHap,
  recipe: [
  { ingredientId: 'ING-TOM', qty: 0.3 },
  { ingredientId: 'ING-HT', qty: 0.05 },
  { ingredientId: 'ING-GV', qty: 0.01 }]

},
{
  id: 'DISH-07', name: 'Salad cà chua xà lách', price: 75_000, category: 'Rau', image: IMG.salad,
  recipe: [
  { ingredientId: 'ING-XL', qty: 0.15 },
  { ingredientId: 'ING-CC', qty: 0.1 },
  { ingredientId: 'ING-SOT', qty: 0.02 }]

},
{
  id: 'DISH-08', name: 'Súp hành tây', price: 60_000, category: 'Khai vị', image: IMG.supHanh,
  recipe: [
  { ingredientId: 'ING-HT', qty: 0.15 },
  { ingredientId: 'ING-GV', qty: 0.01 }]

},
{
  id: 'DISH-09', name: 'Nấm kim châm xào', price: 85_000, category: 'Rau', image: IMG.namXao,
  recipe: [
  { ingredientId: 'ING-NAM', qty: 0.2 },
  { ingredientId: 'ING-HT', qty: 0.04 },
  { ingredientId: 'ING-GV', qty: 0.01 }]

},
{
  id: 'DISH-10', name: 'Nước ngọt lon', price: 25_000, category: 'Đồ uống', image: IMG.nuocNgot,
  recipe: [], readyMade: true, stockIngredientId: 'ING-NN'
},
{
  id: 'DISH-11', name: 'Nước suối', price: 15_000, category: 'Đồ uống', image: IMG.nuocSuoi,
  recipe: [], readyMade: true, stockIngredientId: 'ING-NS'
},
{
  id: 'DISH-12', name: 'Bánh tráng mè', price: 20_000, category: 'Khai vị', image: IMG.banhTrang,
  recipe: [], readyMade: true, stockIngredientId: 'ING-BT'
}];


export const dishImages = Object.values(IMG);

export const initialTx: StockTx[] = batches.map((b, i): StockTx => ({
  id: `TX-SEED-${i + 1}`,
  at: b.receivedAt,
  type: 'NHẬP KHO',
  batchId: b.id,
  ingredientId: b.ingredientId,
  qty: b.initialQuantity,
  unit: ingredients.find((ing) => ing.id === b.ingredientId)!.unit,
  user: 'Trần Văn Kho',
  reason: `Nhập từ ${suppliers.find((s) => s.id === b.supplierId)?.name}`,
  value: b.initialQuantity * b.unitCost
})).concat([
{
  id: 'TX-SEED-90', at: iso(-1, 20, 10), type: 'BÁN HÀNG', batchId: 'LOT-TOM-002',
  ingredientId: 'ING-TOM', qty: 2, unit: 'kg', user: 'Hệ thống',
  reason: 'Trừ kho theo công thức (đơn HD-1042)', value: 704_000
},
{
  id: 'TX-SEED-91', at: iso(-3, 17, 30), type: 'HỦY', batchId: 'LOT-CC-002',
  ingredientId: 'ING-CC', qty: 4, unit: 'kg', user: 'Trần Văn Kho',
  reason: 'Hư hỏng — dập nát khi vận chuyển', value: 112_000
},
{
  id: 'TX-SEED-92', at: iso(-2, 15, 5), type: 'HAO HỤT', batchId: 'LOT-XL-001',
  ingredientId: 'ING-XL', qty: 1, unit: 'kg', user: 'Trần Văn Kho',
  reason: 'Hao hụt sơ chế', value: 44_000
}]
);

export const areas: Area[] = [
{ id: 'AREA-1', name: 'Tầng 1' },
{ id: 'AREA-2', name: 'Sân vườn' },
{ id: 'AREA-3', name: 'Phòng VIP' }];


export const tables: DiningTable[] = [
{ id: 'T-01', name: 'Bàn 01', areaId: 'AREA-1', seats: 4 },
{ id: 'T-02', name: 'Bàn 02', areaId: 'AREA-1', seats: 4 },
{ id: 'T-03', name: 'Bàn 03', areaId: 'AREA-1', seats: 2 },
{ id: 'T-04', name: 'Bàn 04', areaId: 'AREA-1', seats: 6 },
{ id: 'T-05', name: 'Bàn 05', areaId: 'AREA-1', seats: 4 },
{ id: 'T-06', name: 'Bàn 06', areaId: 'AREA-1', seats: 8 },
{ id: 'T-07', name: 'SV 01', areaId: 'AREA-2', seats: 4 },
{ id: 'T-08', name: 'SV 02', areaId: 'AREA-2', seats: 4 },
{ id: 'T-09', name: 'SV 03', areaId: 'AREA-2', seats: 6 },
{ id: 'T-10', name: 'SV 04', areaId: 'AREA-2', seats: 2 },
{ id: 'T-11', name: 'VIP 01', areaId: 'AREA-3', seats: 10 },
{ id: 'T-12', name: 'VIP 02', areaId: 'AREA-3', seats: 12 }];


export const accounts: Account[] = [
{ username: 'quanly', password: '123456', name: 'Nguyễn Minh Quân', role: 'Quản lý' },
{ username: 'bep', password: '123456', name: 'Lê Văn Bếp', role: 'Bếp' },
{ username: 'phucvu', password: '123456', name: 'Phạm Thu Hà', role: 'Phục vụ' },
{ username: 'thungan', password: '123456', name: 'Võ Ngọc Lan', role: 'Thu ngân' },
{ username: 'kho', password: '123456', name: 'Trần Văn Kho', role: 'Nhân viên kho' }];


type L = OrderLine;
const line = (
lineId: string, dishId: string, name: string, price: number, qty: number,
status: L['status'], sentMin: number, note?: string)
: L => ({
  lineId, dishId, name, price, qty, status, note,
  sentAt: new Date(Date.now() - sentMin * 60000).toISOString(),
  startedAt: status === 'COOKING' || status === 'READY' ?
  new Date(Date.now() - (sentMin - 2) * 60000).toISOString() : undefined,
  readyAt: status === 'READY' ? new Date(Date.now() - 1 * 60000).toISOString() : undefined
});

const paid = (
id: string, tableId: string, hour: number, minute: number, lines: L[],
method: Order['paymentMethod'], cost: number)
: Order => {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const vat = Math.round(subtotal * 0.08);
  return {
    id, tableId, lines, status: 'PAID', createdAt: iso(0, hour, minute - 40),
    createdBy: 'Phạm Thu Hà', paidAt: iso(0, hour, minute), paidBy: 'Võ Ngọc Lan',
    paymentMethod: method, subtotal, discountRate: 0, discount: 0, vat,
    total: subtotal + vat, cost
  };
};

export const seedOrders: Order[] = [
{
  id: 'HD-1052', tableId: 'T-02', status: 'OPEN', createdAt: iso(0, 12, 5), createdBy: 'Phạm Thu Hà',
  lines: [
  line('L-1', 'DISH-02', 'Bò lúc lắc', 185_000, 2, 'READY', 25),
  line('L-2', 'DISH-07', 'Salad cà chua xà lách', 75_000, 1, 'COOKING', 12),
  line('L-3', 'DISH-10', 'Nước ngọt lon', 25_000, 2, 'READY', 25)],

  subtotal: 0, discountRate: 0, discount: 0, vat: 0, total: 0
},
{
  id: 'HD-1053', tableId: 'T-07', status: 'OPEN', createdAt: iso(0, 12, 20), createdBy: 'Phạm Thu Hà',
  lines: [
  line('L-4', 'DISH-05', 'Tôm nướng muối ớt', 220_000, 2, 'PENDING', 4, 'Ít cay'),
  line('L-5', 'DISH-01', 'Bò ba chỉ nướng', 150_000, 1, 'PENDING', 4),
  line('L-6', 'DISH-11', 'Nước suối', 15_000, 3, 'READY', 4),
  line('L-7', 'DISH-12', 'Bánh tráng mè', 20_000, 1, 'READY', 4)],

  subtotal: 0, discountRate: 0, discount: 0, vat: 0, total: 0
},
{
  id: 'HD-1054', tableId: 'T-05', status: 'OPEN', createdAt: iso(0, 11, 30), createdBy: 'Phạm Thu Hà',
  lines: [
  line('L-8', 'DISH-04', 'Lẩu bò', 320_000, 1, 'READY', 50),
  line('L-9', 'DISH-10', 'Nước ngọt lon', 25_000, 4, 'READY', 50)],

  subtotal: 0, discountRate: 0, discount: 0, vat: 0, total: 0
},
paid('HD-1049', 'T-04', 11, 20, [
line('L-90', 'DISH-01', 'Bò ba chỉ nướng', 150_000, 3, 'READY', 90),
line('L-91', 'DISH-10', 'Nước ngọt lon', 25_000, 3, 'READY', 90)],
'Tiền mặt', 212_000),
paid('HD-1050', 'T-11', 11, 45, [
line('L-92', 'DISH-04', 'Lẩu bò', 320_000, 2, 'READY', 90),
line('L-93', 'DISH-06', 'Tôm hấp bia', 240_000, 1, 'READY', 90),
line('L-94', 'DISH-11', 'Nước suối', 15_000, 6, 'READY', 90)],
'Chuyển khoản', 468_000),
paid('HD-1051', 'T-01', 12, 10, [
line('L-95', 'DISH-02', 'Bò lúc lắc', 185_000, 2, 'READY', 60),
line('L-96', 'DISH-07', 'Salad cà chua xà lách', 75_000, 1, 'READY', 60)],
'Thẻ', 168_000)];


/** Số liệu đã chốt từ đầu ca hôm nay (các đơn trước khi mở phần mềm) */
export const baselineToday = {
  revenue: 23_600_000,
  cost: 8_500_000,
  orders: 39,
  dishes: 108
};

export const baselineDishSold: Record<string, number> = {
  'DISH-01': 34, 'DISH-02': 21, 'DISH-05': 18, 'DISH-04': 12, 'DISH-03': 11,
  'DISH-06': 9, 'DISH-07': 8, 'DISH-10': 26, 'DISH-08': 5, 'DISH-09': 4
};

export const dailyStats: DailyStat[] = [
{ date: iso(-6), revenue: 21_400_000, cost: 8_100_000 },
{ date: iso(-5), revenue: 19_800_000, cost: 7_600_000 },
{ date: iso(-4), revenue: 24_600_000, cost: 9_050_000 },
{ date: iso(-3), revenue: 28_900_000, cost: 10_400_000 },
{ date: iso(-2), revenue: 31_200_000, cost: 11_100_000 },
{ date: iso(-1), revenue: 27_450_000, cost: 9_850_000 }];
