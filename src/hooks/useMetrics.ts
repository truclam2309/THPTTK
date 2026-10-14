import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { availableQty, batchState, daysLeft } from '../utils/inventory';

export function useMetrics() {
  const {
    batches,
    ingredients,
    orders,
    dishes,
    dishSold,
    baseline,
    dailyStats,
    transactions
  } = useApp();

  return useMemo(() => {
    const now = new Date();
    const active = batches.filter((b) => !b.cancelled);
    const nearExpiry = active.filter((b) => batchState(b, now) === 'NEAR_EXPIRY');
    const expired = active.filter((b) => batchState(b, now) === 'EXPIRED');
    const cancelled = batches.filter((b) => b.cancelled);

    const stockValue = active.
    filter((b) => daysLeft(b.expiryDate, now) >= 0).
    reduce((s, b) => s + b.quantity * b.unitCost, 0);

    const lowStock = ingredients.filter(
      (i) => availableQty(batches, i.id, now) < i.minStock
    );

    const paidOrders = orders.filter((o) => o.status === 'PAID');
    const openOrders = orders.filter((o) => o.status === 'OPEN');
    const kitchenLines = openOrders.flatMap((o) =>
    o.lines.filter((l) => l.status === 'PENDING' || l.status === 'COOKING')
    );
    const liveRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
    const liveCost = paidOrders.reduce((s, o) => s + (o.cost ?? 0), 0);

    const disposalCostToday = transactions.
    filter(
      (t) =>
      (t.type === 'HỦY' || t.type === 'HAO HỤT') &&
      daysLeft(t.at, now) === 0
    ).
    reduce((s, t) => s + t.value, 0);

    const revenueToday = baseline.revenue + liveRevenue;
    const costToday = baseline.cost + liveCost + disposalCostToday;
    const profitToday = revenueToday - costToday;

    const monthBase = dailyStats.reduce((s, d) => s + d.revenue, 0);
    const revenueMonth = monthBase + revenueToday;
    const costMonth =
    dailyStats.reduce((s, d) => s + d.cost, 0) + costToday;

    const dishesSoldToday =
    baseline.dishes +
    paidOrders.reduce(
      (s, o) => s + o.lines.reduce((n, l) => n + l.qty, 0),
      0
    );

    const ordersToday = baseline.orders + orders.length;

    const series = [
    ...dailyStats.map((d) => ({
      date: d.date,
      revenue: d.revenue,
      cost: d.cost,
      profit: d.revenue - d.cost
    })),
    {
      date: now.toISOString(),
      revenue: revenueToday,
      cost: costToday,
      profit: profitToday
    }];


    const topDishes = dishes.
    map((d) => ({
      name: d.name,
      sold: dishSold[d.id] ?? 0,
      revenue: (dishSold[d.id] ?? 0) * d.price
    })).
    sort((a, b) => b.sold - a.sold).
    slice(0, 6);

    const costByGroup = Object.entries(
      active.reduce<Record<string, number>>((acc, b) => {
        const ing = ingredients.find((i) => i.id === b.ingredientId)!;
        acc[ing.group] = (acc[ing.group] ?? 0) + b.quantity * b.unitCost;
        return acc;
      }, {})
    ).map(([group, value]) => ({ group, value }));

    return {
      nearExpiry,
      expired,
      cancelled,
      stockValue,
      lowStock,
      revenueToday,
      costToday,
      profitToday,
      revenueMonth,
      costMonth,
      profitMonth: revenueMonth - costMonth,
      dishesSoldToday,
      ordersToday,
      series,
      topDishes,
      costByGroup,
      disposalCostToday,
      ingredientCount: ingredients.length,
      activeBatchCount: active.filter(
        (b) => daysLeft(b.expiryDate, now) >= 0 && b.quantity > 0
      ).length,
      openOrders,
      paidOrders,
      kitchenLines
    };
  }, [batches, ingredients, orders, dishes, dishSold, baseline, dailyStats, transactions]);
}