'use client'

import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PurchaseOrderDetail {
  id: string
  orderNumber: string
  supplier: {
    id: string
    companyName: string
    phone?: string
    email?: string
  }
  status: string
  paymentStatus: string
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  amountDue: number
  expectedDelivery?: string
  notes?: string
  createdAt: string
  updatedAt: string
  items: {
    id: string
    product: {
      id: string
      name: string
      sku: string
    }
    quantity: number
    costPrice: number
    receivedQty: number
  }[]
  payments: {
    id: string
    amount: number
    paymentMethod: string
    notes?: string
    createdAt: string
  }[]
}

export default function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('purchaseOrders')
  const tc = useTranslations()

  const { data: po, isLoading } = useQuery<PurchaseOrderDetail>({
    queryKey: ['purchase-order', params.id],
    queryFn: () => api.get(`/purchase-orders/${params.id}`).then(r => r.data),
  })

  const markAsReceivedMutation = useMutation({
    mutationFn: () => api.patch(`/purchase-orders/${params.id}/receive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', params.id] })
      toast.success('Purchase order marked as received and inventory updated')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update status'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/purchase-orders/${params.id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', params.id] })
      toast.success('Purchase order cancelled')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to cancel order'),
  })

  const updatePaymentStatusMutation = useMutation({
    mutationFn: (status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID') =>
      api.patch(`/purchase-orders/${params.id}/payment-status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', params.id] })
      toast.success('Payment status updated')
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update payment status'),
  })

  const convertToLoanMutation = useMutation({
    mutationFn: () =>
      api.post('/loans', {
        supplierId: po?.supplier.id,
        type: 'SUPPLIER_LOAN',
        principalAmount: Number(po?.amountDue),
        reason: `Loan created from Purchase Order ${po?.orderNumber}`,
        purchaseOrderId: params.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', params.id] })
      toast.success('Due amount converted to supplier loan')
      router.push(`/suppliers/${po?.supplier.id}`)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create loan'),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Purchase Order" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{tc('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!po) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Purchase Order" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Purchase order not found</p>
        </div>
      </div>
    )
  }

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
      <Header title={po.orderNumber} />
      <div className="flex-1 p-6">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">{po.orderNumber}</h1>
              <p className="text-sm text-muted-foreground">Created {formatDate(po.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getPaymentStatusVariant(po.paymentStatus)}>
                {po.paymentStatus}
              </Badge>
              <Badge variant={getStatusVariant(po.status)}>
                {t(`status.${po.status}` as any)}
              </Badge>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                    <>
                      <DropdownMenuItem onClick={() => markAsReceivedMutation.mutate()}>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Mark as Received
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {po.status !== 'CANCELLED' && (
                    <>
                      <DropdownMenuItem onClick={() => cancelMutation.mutate()} className="text-destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Order
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {po.amountDue > 0 && (
                    <>
                      <DropdownMenuItem onClick={() => convertToLoanMutation.mutate()}>
                        <AlertCircle className="h-4 w-4 mr-2 text-orange-600" />
                        Convert Due to Loan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => updatePaymentStatusMutation.mutate('PAID')}>
                    Mark as Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePaymentStatusMutation.mutate('PARTIALLY_PAID')}>
                    Mark as Partially Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePaymentStatusMutation.mutate('UNPAID')}>
                    Mark as Unpaid
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Supplier Info */}
            <Card>
              <CardHeader>
                <CardTitle>Supplier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">{po.supplier.companyName}</p>
                </div>
                {po.supplier.phone && (
                  <div>
                    <p className="text-muted-foreground">Phone: {po.supplier.phone}</p>
                  </div>
                )}
                {po.supplier.email && (
                  <div>
                    <p className="text-muted-foreground">Email: {po.supplier.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(po.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">{formatCurrency(po.tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">{formatCurrency(po.total)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Paid:</span>
                  <span className="font-medium">{formatCurrency(po.amountPaid)}</span>
                </div>
                {po.amountDue > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Due:</span>
                    <span className="font-medium">{formatCurrency(po.amountDue)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {po.expectedDelivery && (
                  <div>
                    <p className="text-muted-foreground">Expected: {formatDate(po.expectedDelivery)}</p>
                  </div>
                )}
                {po.notes && (
                  <div>
                    <p className="text-muted-foreground">Notes:</p>
                    <p>{po.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell className="font-mono text-xs">{item.product.sku}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.receivedQty === item.quantity ? 'default' : 'secondary'}>
                            {item.receivedQty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.costPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.costPrice * item.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {po.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {po.payments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-muted-foreground text-xs">{formatDate(payment.createdAt)}</TableCell>
                          <TableCell className="font-medium text-emerald-600">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell className="text-muted-foreground">{payment.notes ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
