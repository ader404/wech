'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface ItemRow {
  id: string
  productId: string
  quantity: number
  costPrice: number
}

interface Product {
  id: string
  name: string
  sku: string
  costPrice: number
}

interface Supplier {
  id: string
  companyName: string
}

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations()
  const [supplierId, setSupplierId] = useState(searchParams.get('supplierId') || '')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [notes, setNotes] = useState('')
  const [tax, setTax] = useState(0)
  const [amountPaid, setAmountPaid] = useState(0)
  const [items, setItems] = useState<ItemRow[]>([
    { id: '1', productId: '', quantity: 0, costPrice: 0 }
  ])

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-all'],
    queryFn: async () => {
      const res = await api.get('/products?limit=1000')
      return res.data.data || res.data || []
    }
  })

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers?limit=100')
      return res.data.data || res.data || []
    }
  })

  const createPOMutation = useMutation({
    mutationFn: (data: any) => api.post('/purchase-orders', data),
    onSuccess: (response) => {
      toast.success('Purchase order created successfully')
      router.push(`/purchase-orders/${response.data.id}`)
    },
    onError: (e: any) => {
      const errorMsg = e.response?.data?.message
      toast.error(errorMsg ? `Failed: ${errorMsg}` : 'Failed to create purchase order')
    }
  })

  const addItemRow = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), productId: '', quantity: 0, costPrice: 0 }
    ])
  }

  const removeItemRow = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof ItemRow, value: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: value }
        // Auto-fill cost price when product is selected
        if (field === 'productId' && value) {
          const product = products.find(p => p.id === value)
          if (product) {
            updated.costPrice = Number(product.costPrice)
          }
        }
        return updated
      }
      return i
    }))
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, i) => sum + (i.costPrice * i.quantity), 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + tax
  }

  const calculateAmountDue = () => {
    return Math.max(0, calculateTotal() - amountPaid)
  }

  const validateForm = () => {
    if (!supplierId) {
      toast.error('Please select a supplier')
      return false
    }

    const validItems = items.filter(i => i.productId && i.quantity > 0 && i.costPrice > 0)

    if (validItems.length === 0) {
      toast.error('Please add at least one valid item')
      return false
    }

    return true
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const validItems = items.filter(i => i.productId && i.quantity > 0 && i.costPrice > 0)

    const payload = {
      supplierId,
      items: validItems.map(i => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        costPrice: Number(i.costPrice),
      })),
      tax: Number(tax) || 0,
      amountPaid: Number(amountPaid) || 0,
      expectedDelivery: expectedDelivery || undefined,
      notes: notes.trim() || undefined
    }

    console.log('Sending payload:', payload) // Debug log
    createPOMutation.mutate(payload)
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="New Purchase Order" />
      <div className="flex-1 p-6">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">New Purchase Order</h1>
              <p className="text-sm text-muted-foreground">Create a new purchase order for existing products</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* General Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier *</Label>
                    <Select value={supplierId} onValueChange={setSupplierId}>
                      <SelectTrigger id="supplier">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                    <Input
                      id="expectedDelivery"
                      type="date"
                      value={expectedDelivery}
                      onChange={(e) => setExpectedDelivery(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add notes about this order..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle>Items</CardTitle>
                      <CardDescription>Add products to this order</CardDescription>
                    </div>
                    <Button onClick={addItemRow} size="sm" className="self-start sm:self-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            Item #{index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItemRow(item.id)}
                            disabled={items.length === 1}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`product-${item.id}`}>Product *</Label>
                            <Select
                              value={item.productId}
                              onValueChange={(value) => updateItem(item.id, 'productId', value)}
                            >
                              <SelectTrigger id={`product-${item.id}`}>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map(product => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`quantity-${item.id}`}>Quantity *</Label>
                            <Input
                              id={`quantity-${item.id}`}
                              type="number"
                              min="0"
                              value={item.quantity || ''}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`cost-${item.id}`}>Unit Cost *</Label>
                            <Input
                              id={`cost-${item.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.costPrice || ''}
                              onChange={(e) => updateItem(item.id, 'costPrice', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {item.costPrice > 0 && item.quantity > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal:</span>
                              <span className="font-medium">
                                {formatCurrency(item.costPrice * item.quantity)}
                              </span>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tax">Tax</Label>
                      <Input
                        id="tax"
                        type="number"
                        step="0.01"
                        min="0"
                        value={tax || ''}
                        onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Total:</span>
                      <span className="text-lg font-bold">{formatCurrency(calculateTotal())}</span>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <Label htmlFor="amountPaid">Amount Paid</Label>
                      <Input
                        id="amountPaid"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountPaid || ''}
                        onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>

                    {calculateAmountDue() > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Amount Due:</span>
                        <span className="font-medium">{formatCurrency(calculateAmountDue())}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={createPOMutation.isPending}
                  >
                    {createPOMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Order will be created in PENDING status
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
