'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Search, X, Plus, User } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  debt: number
  credit: number
}

interface CustomerSelectionModalProps {
  open: boolean
  onClose: () => void
  onSelect: (customer: Customer | null) => void
  selectedCustomerId?: string | null
}

interface AddCustomerFormData {
  name: string
  phone: string
  email: string
  address: string
}

export function CustomerSelectionModal({ open, onClose, onSelect, selectedCustomerId }: CustomerSelectionModalProps) {
  const t = useTranslations('pos.customerModal')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<AddCustomerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
  })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearch('')
      setPage(1)
      setShowAddForm(false)
      setFormData({ name: '', phone: '', email: '', address: '' })
    }
  }, [open])

  // Fetch customers with search and pagination
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers-search', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      })
      const res = await api.get(`/customers?${params}`)
      return res.data
    },
    enabled: open && !showAddForm,
  })

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: AddCustomerFormData) => {
      const res = await api.post('/customers', data)
      return res.data
    },
    onSuccess: (newCustomer) => {
      toast.success(t('customerCreated'))
      queryClient.invalidateQueries({ queryKey: ['customers-search'] })
      onSelect(newCustomer)
      onClose()
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('customerCreateFailed')
      toast.error(message)
    },
  })

  const handleSelect = (customer: Customer) => {
    onSelect(customer)
    onClose()
  }

  const handleClear = () => {
    onSelect(null)
    onClose()
  }

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error(t('nameRequired'))
      return
    }
    createCustomerMutation.mutate(formData)
  }

  const customers = customersData?.data || []
  const meta = customersData?.meta

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{showAddForm ? t('addCustomer') : t('selectCustomer')}</DialogTitle>
        </DialogHeader>

        {!showAddForm ? (
          <>
            {/* Search and Add Button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setShowAddForm(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t('addCustomer')}
              </Button>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-muted-foreground">{tCommon('loading')}</div>
                </div>
              ) : customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <User className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t('noCustomers')}</p>
                </div>
              ) : (
                customers.map((customer: Customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelect(customer)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors hover:bg-accent ${
                      selectedCustomerId === customer.id ? 'border-primary bg-accent' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {customer.phone && <div>{customer.phone}</div>}
                          {customer.email && <div>{customer.email}</div>}
                        </div>
                      </div>
                      <div className="text-right">
                        {Number(customer.debt) > 0 ? (
                          <Badge variant="destructive" className="font-mono">
                            {t('outstanding')}: {formatCurrency(Number(customer.debt))}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-mono">
                            {t('outstanding')}: {formatCurrency(0)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!meta.hasPreviousPage}
                >
                  {tCommon('previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {tCommon('page')} {meta.page} {tCommon('of')} {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!meta.hasNextPage}
                >
                  {tCommon('next')}
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleClear} className="flex-1">
                {t('clearSelection')}
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                {tCommon('cancel')}
              </Button>
            </div>
          </>
        ) : (
          /* Add Customer Form */
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div>
              <Label htmlFor="name">{t('customerName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('customerNamePlaceholder')}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('phonePlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="address">{t('address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t('addressPlaceholder')}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="flex-1"
                disabled={createCustomerMutation.isPending}
              >
                {tCommon('back')}
              </Button>
              <Button type="submit" className="flex-1" disabled={createCustomerMutation.isPending}>
                {createCustomerMutation.isPending ? tCommon('saving') : tCommon('save')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
