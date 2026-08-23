'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Eye, FileText } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/skeletons'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplier: {
    id: string
    companyName: string
  }
  status: string
  paymentStatus: string
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  amountDue: number
  expectedDelivery?: string
  createdAt: string
  items: any[]
}

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const t = useTranslations('purchaseOrders')
  const tc = useTranslations()

  const { data: purchaseOrders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: () => api.get('/purchase-orders').then(res => res.data)
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'default'
      case 'PENDING': return 'secondary'
      case 'PARTIAL': return 'outline'
      case 'CANCELLED': return 'destructive'
      default: return 'outline'
    }
  }

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'PAID': return 'default'
      case 'PARTIALLY_PAID': return 'secondary'
      case 'UNPAID': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title={tc('navigation.purchaseOrders')} />
      <div className="flex-1 p-6">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{tc('navigation.purchaseOrders')}</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage purchase orders and track deliveries</p>
            </div>
            <Button onClick={() => router.push('/purchase-orders/new')}>
              <FileText className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </div>

          <Card className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <TableSkeleton rows={5} columns={9} />
                    </TableCell>
                  </TableRow>
                ) : purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-1">
                        <FileText className="h-5 w-5 opacity-40" />
                        <span>No purchase orders found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map(po => (
                    <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/purchase-orders/${po.id}`)}>
                      <TableCell className="font-mono text-xs font-medium">{po.orderNumber}</TableCell>
                      <TableCell>{po.supplier.companyName}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(po.createdAt)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(po.total)}</TableCell>
                      <TableCell className="text-emerald-600">{formatCurrency(po.amountPaid)}</TableCell>
                      <TableCell className="text-destructive">{po.amountDue > 0 ? formatCurrency(po.amountDue) : '—'}</TableCell>
                      <TableCell>
                        <Badge variant={getPaymentStatusVariant(po.paymentStatus)}>
                          {po.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(po.status)}>
                          {t(`status.${po.status}` as any)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/purchase-orders/${po.id}`)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  )
}
