import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async salesSummary(dateFrom: string, dateTo: string) {
    const where = {
      status: 'COMPLETED' as const,
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
    }

    const [agg, byDay] = await Promise.all([
      this.prisma.sale.aggregate({ where, _count: true, _sum: { total: true, discount: true }, _avg: { total: true } }),
      this.prisma.sale.groupBy({
        by: ['createdAt'],
        where,
        _sum: { total: true },
        _count: true,
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Group by day (YYYY-MM-DD)
    const dayMap: Record<string, { date: string; revenue: number; count: number }> = {}
    for (const row of byDay) {
      const day = row.createdAt.toISOString().slice(0, 10)
      if (!dayMap[day]) dayMap[day] = { date: day, revenue: 0, count: 0 }
      dayMap[day].revenue += Number(row._sum.total ?? 0)
      dayMap[day].count += row._count
    }

    return {
      totalRevenue: Number(agg._sum.total ?? 0),
      totalSales: agg._count,
      avgSaleValue: Number(agg._avg.total ?? 0),
      totalDiscount: Number(agg._sum.discount ?? 0),
      byDay: Object.values(dayMap),
    }
  }

  async expensesSummary(dateFrom: string, dateTo: string) {
    const where = {
      date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
    }

    const [agg, byCategory] = await Promise.all([
      this.prisma.expense.aggregate({ where, _count: true, _sum: { amount: true } }),
      this.prisma.expense.groupBy({ by: ['category'], where, _sum: { amount: true }, _count: true }),
    ])

    return {
      totalExpenses: Number(agg._sum.amount ?? 0),
      count: agg._count,
      byCategory: byCategory.map(c => ({ category: c.category, total: Number(c._sum.amount ?? 0), count: c._count })),
    }
  }

  async topProducts(dateFrom: string, dateTo: string, limit = 10) {
    const where = {
      sale: {
        status: 'COMPLETED' as const,
        createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
    }

    const rows = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where,
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    })

    const productIds = rows.map(r => r.productId)
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, category: { select: { name: true } } },
    })
    const productMap = Object.fromEntries(products.map(p => [p.id, p]))

    return rows.map(r => ({
      productId: r.productId,
      productName: productMap[r.productId]?.name ?? r.productId,
      sku: productMap[r.productId]?.sku ?? '',
      category: productMap[r.productId]?.category?.name ?? '',
      qtySold: r._sum.quantity ?? 0,
      revenue: Number(r._sum.total ?? 0),
    }))
  }

  async paymentMethods(dateFrom: string, dateTo: string) {
    const where = {
      status: 'COMPLETED' as const,
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
    }

    const rows = await this.prisma.sale.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { total: true },
      _count: true,
    })

    return rows.map(r => ({ method: r.paymentMethod, total: Number(r._sum.total ?? 0), count: r._count }))
  }

  async revenueVsExpenses(year: number) {
    const start = new Date(`${year}-01-01`)
    const end = new Date(`${year}-12-31T23:59:59`)

    const [sales, expenses] = await Promise.all([
      this.prisma.sale.groupBy({
        by: ['createdAt'],
        where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } },
        _sum: { total: true },
      }),
      this.prisma.expense.groupBy({
        by: ['date'],
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ])

    const monthRevenue: number[] = Array(12).fill(0)
    const monthExpenses: number[] = Array(12).fill(0)

    for (const row of sales) {
      const m = new Date(row.createdAt).getMonth()
      monthRevenue[m] += Number(row._sum.total ?? 0)
    }
    for (const row of expenses) {
      const m = new Date(row.date).getMonth()
      monthExpenses[m] += Number(row._sum.amount ?? 0)
    }

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return months.map((name, i) => ({ month: name, revenue: monthRevenue[i], expenses: monthExpenses[i], profit: monthRevenue[i] - monthExpenses[i] }))
  }

  async profitReport(dateFrom: string, dateTo: string, branchId?: string) {
    const where = {
      sale: {
        status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED'] } as any,
        createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
        ...(branchId ? { branchId } : {}),
      },
    }

    const saleItems: any = await this.prisma.saleItem.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    })

    // Group by product
    const productMap = new Map<string, any>()

    saleItems.forEach((item: any) => {
      const productId = item.productId
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,
          productName: item.product?.name ?? 'Unknown',
          quantitySold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        })
      }

      const data = productMap.get(productId)
      data.quantitySold += item.quantity
      data.revenue += Number(item.total)
      data.cost += Number(item.costPrice) * item.quantity
      data.profit += (Number(item.sellingPrice) - Number(item.costPrice)) * item.quantity
    })

    // Convert to array and add margin
    const profitData = Array.from(productMap.values()).map(item => ({
      ...item,
      margin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0,
    }))

    // Sort by profit descending
    profitData.sort((a, b) => b.profit - a.profit)

    return profitData
  }

  async outstandingReceivables() {
    const where: any = {
      paymentStatus: { in: ['PARTIALLY_PAID', 'UNPAID'] },
    }

    const sales: any = await this.prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group by customer
    const customerMap = new Map<string, any>()

    sales.forEach((sale: any) => {
      const customerId = sale.customerId ?? 'walk-in'
      const customerName = sale.customer?.name ?? 'Walk-in'

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName,
          phone: sale.customer?.phone ?? null,
          totalPurchases: 0,
          totalPaid: 0,
          balance: 0,
        })
      }

      const data = customerMap.get(customerId)
      data.totalPurchases += Number(sale.total)
      data.totalPaid += Number(sale.amountPaid)
      data.balance += Number(sale.amountDue)
    })

    const receivables = Array.from(customerMap.values())

    // Sort by balance descending
    receivables.sort((a, b) => b.balance - a.balance)

    return receivables
  }

  async outstandingPayables() {
    const purchaseOrders: any = await this.prisma.purchaseOrder.findMany({
      where: {
        paymentStatus: { in: ['PARTIALLY_PAID', 'UNPAID'] },
      },
      include: {
        supplier: { select: { id: true, companyName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group by supplier
    const supplierMap = new Map<string, any>()

    purchaseOrders.forEach((po: any) => {
      const supplierId = po.supplierId

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplierId,
          supplierName: po.supplier.companyName,
          contact: po.supplier.phone ?? null,
          totalPurchases: 0,
          totalPaid: 0,
          balance: 0,
        })
      }

      const data = supplierMap.get(supplierId)
      data.totalPurchases += Number(po.total)
      data.totalPaid += Number(po.amountPaid)
      data.balance += Number(po.amountDue)
    })

    const payables = Array.from(supplierMap.values())

    // Sort by balance descending
    payables.sort((a, b) => b.balance - a.balance)

    return payables
  }

  async loanReport(dateFrom: string, dateTo: string, type?: string) {
    const where: any = {
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      ...(type ? { type: type as any } : {}),
    }

    const loans = await this.prisma.loan.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        supplier: { select: { companyName: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return loans.map(loan => ({
      id: loan.id,
      type: loan.type,
      entityName: loan.type === 'CUSTOMER_LOAN'
        ? loan.customer?.name ?? 'Unknown'
        : loan.supplier?.companyName ?? 'Unknown',
      amount: Number(loan.principalAmount),
      paidAmount: Number(loan.amountPaid),
      status: loan.status,
      dueDate: loan.dueDate,
    }))
  }

  async purchaseReport(dateFrom: string, dateTo: string) {
    const purchaseOrders: any = await this.prisma.purchaseOrder.findMany({
      where: {
        createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
      include: {
        supplier: { select: { companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Single shop - no branch names needed
    return purchaseOrders.map((po: any) => ({
      id: po.id,
      orderNumber: po.orderNumber,
      supplierName: po.supplier.companyName,
      totalAmount: Number(po.total),
      paidAmount: Number(po.amountPaid),
      status: po.status,
      orderDate: po.createdAt,
    }))
  }

  async cashflowReport(dateFrom: string, dateTo: string) {
    const where = {
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
    }

    // Sales Revenue (Inflow)
    const sales: any = await this.prisma.sale.findMany({
      where: { ...where, status: 'COMPLETED' },
      select: { total: true },
    })
    const salesRevenue = sales.reduce((sum: number, s: any) => sum + Number(s.total), 0)

    // Customer Payments (Inflow) - sum of amountPaid from sales
    const customerPayments = 0 // Simplified for now

    // Loan Repayments (Inflow) - payments from CUSTOMER_LOAN type
    const loanRepayments = 0 // Simplified for now

    // Purchase Orders (Outflow)
    const purchaseOrders: any = await this.prisma.purchaseOrder.findMany({
      where,
      select: { total: true },
    })
    const purchaseOrdersTotal = purchaseOrders.reduce((sum: number, po: any) => sum + Number(po.total), 0)

    // Expenses (Outflow)
    const expenses: any = await this.prisma.expense.findMany({
      where,
      select: { amount: true },
    })
    const expensesTotal = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0)

    // Supplier Payments (Outflow)
    const supplierPayments = 0 // Simplified for now

    const totalInflow = salesRevenue + customerPayments + loanRepayments
    const totalOutflow = purchaseOrdersTotal + expensesTotal + supplierPayments

    return {
      totalInflow,
      totalOutflow,
      salesRevenue,
      customerPayments,
      loanRepayments,
      purchaseOrders: purchaseOrdersTotal,
      expenses: expensesTotal,
      supplierPayments,
    }
  }

  async cashFlowReport(date: string) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const [salesInflow, expenses, supplierPayments, loanPaymentsReceived, loanPaymentsMade] = await Promise.all([
      // Cash inflow from sales
      this.prisma.payment.aggregate({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { amount: true },
      }),
      // Cash outflow - expenses
      this.prisma.expense.aggregate({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { amount: true },
      }),
      // Cash outflow - supplier payments
      this.prisma.supplierPayment.aggregate({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { amount: true },
      }),
      // Cash inflow - loan payments received
      this.prisma.loanPayment.aggregate({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          loan: { type: 'CUSTOMER_LOAN' },
        },
        _sum: { amount: true },
      }),
      // Cash outflow - loan payments made
      this.prisma.loanPayment.aggregate({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          loan: { type: 'SUPPLIER_LOAN' },
        },
        _sum: { amount: true },
      }),
    ])

    const totalInflow = Number(salesInflow._sum.amount ?? 0) + Number(loanPaymentsReceived._sum.amount ?? 0)
    const totalOutflow = Number(expenses._sum.amount ?? 0) + Number(supplierPayments._sum.amount ?? 0) + Number(loanPaymentsMade._sum.amount ?? 0)
    const netCashFlow = totalInflow - totalOutflow

    return {
      date: startOfDay,
      inflow: {
        sales: Number(salesInflow._sum.amount ?? 0),
        loanPayments: Number(loanPaymentsReceived._sum.amount ?? 0),
        total: totalInflow,
      },
      outflow: {
        expenses: Number(expenses._sum.amount ?? 0),
        supplierPayments: Number(supplierPayments._sum.amount ?? 0),
        loanPayments: Number(loanPaymentsMade._sum.amount ?? 0),
        total: totalOutflow,
      },
      netCashFlow,
    }
  }
}
