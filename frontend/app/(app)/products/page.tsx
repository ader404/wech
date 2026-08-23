'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Plus, Search, Pencil, Trash2, Package, Tag, Layers, ScanBarcode, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarcodeScannerDialog } from '@/components/barcode/barcode-scanner-dialog'
import { AuthImage } from '@/components/ui/auth-image'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface Category { id: string; name: string }
interface Brand { id: string; name: string }
interface Supplier { id: string; companyName: string }
interface InventoryEntry { quantity: number; minStock: number }
interface Product {
  id: string
  name: string
  sku?: string
  barcode?: string
  imageUrl?: string
  costPrice: number
  sellingPrice: number
  isActive: boolean
  category: Category
  brand?: Brand
  inventory?: InventoryEntry | null
  createdAt: string
}

const defaultForm = {
  name: '', sku: '', barcode: '', description: '', categoryId: '', brandId: '', supplierId: '',
  costPrice: '', sellingPrice: '', imageUrl: '', quantity: '', isActive: true,
}
// Picked-but-not-yet-uploaded image file — images are stored server-side keyed
// by productId, so a new product's image can only be uploaded after creation
// returns an id. previewUrl is a local object URL used only for instant preview.
type PendingImage = { file: File; previewUrl: string } | null

type Tab = 'products' | 'categories' | 'brands'

export default function ProductsPage() {
  const t = useTranslations('products')
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('products')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [pendingImage, setPendingImage] = useState<PendingImage>(null)
  const [catName, setCatName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [formScannerOpen, setFormScannerOpen] = useState(false)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState('')
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null)
  const [stockQuantity, setStockQuantity] = useState('')
  const [stockCostPrice, setStockCostPrice] = useState('')
  const [hwScanInput, setHwScanInput] = useState('')

  const { data: productsData, isLoading } = useQuery<any>({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products?limit=100').then((r) => {
      console.log('Products API response:', r.data)
      return r.data
    }),
  })
  const products = productsData?.data || []
  console.log('productsData:', productsData)
  console.log('products array:', products)

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then((r) => r.data),
  })
  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: () => api.get('/products/brands').then((r) => r.data),
  })
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers?limit=100').then((r) => r.data.data || r.data),
  })

  // Uploads the pending image (if any) for a just-created/just-updated product.
  // The image endpoint is keyed by productId, so this always runs after the
  // product itself exists.
  async function uploadPendingImageIfAny(productId: string) {
    if (!pendingImage) return
    const fd = new FormData()
    fd.append('file', pendingImage.file)
    await api.post(`/products/${productId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/products', data),
    onSuccess: async (res) => {
      await uploadPendingImageIfAny(res.data.id)
      queryClient.invalidateQueries({ queryKey: ['products-all'] }); toast.success(t('toasts.productCreated')); closeDialog()
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? t('toasts.failed')),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/products/${id}`, data),
    onSuccess: async (res) => {
      await uploadPendingImageIfAny(res.data.id)
      queryClient.invalidateQueries({ queryKey: ['products-all'] }); toast.success(t('toasts.productUpdated')); closeDialog()
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? t('toasts.failed')),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products-all'] }); toast.success(t('toasts.productDeactivated')) },
    onError: () => toast.error(t('toasts.failedDeactivate')),
  })
  const createCatMutation = useMutation({
    mutationFn: (name: string) => api.post('/products/categories', { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success(t('toasts.categoryCreated')); setCatName('') },
    onError: (e: any) => toast.error(e.response?.data?.message ?? t('toasts.failed')),
  })
  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: () => toast.error(t('toasts.cannotDeleteCategory')),
  })
  const createBrandMutation = useMutation({
    mutationFn: (name: string) => api.post('/products/brands', { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['brands'] }); toast.success(t('toasts.brandCreated')); setBrandName('') },
    onError: (e: any) => toast.error(e.response?.data?.message ?? t('toasts.failed')),
  })
  const deleteBrandMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/brands/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
    onError: () => toast.error(t('toasts.cannotDeleteBrand')),
  })
  const incrementStockMutation = useMutation({
    mutationFn: (data: { productId: string; quantity: number; costPrice?: number }) => api.post('/inventory/increment', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-all'] })
      toast.success(t('toasts.stockUpdated'))
      closeStockDialog()
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? t('toasts.failedUpdateStock')),
  })

  function pickImage(file: File) {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) })
  }

  const filtered = products.filter((p: any) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === 'all' || p.category.id === filterCategory
    return matchSearch && matchCat
  })

  function openCreate() { setEditing(null); setForm(defaultForm); setPendingImage(null); setDialogOpen(true) }
  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, sku: p.sku ?? '', barcode: p.barcode ?? '', description: '', categoryId: p.category.id, brandId: p.brand?.id ?? '', supplierId: '', costPrice: String(p.costPrice), sellingPrice: String(p.sellingPrice), imageUrl: p.imageUrl ?? '', quantity: '', isActive: p.isActive })
    setPendingImage(null)
    setDialogOpen(true)
  }
  function closeDialog() {
    setDialogOpen(false); setEditing(null); setForm(defaultForm)
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    setPendingImage(null)
  }

  async function handleScannedBarcode(code: string) {
    const trimmed = code.trim()
    if (!trimmed) return
    const local = products.find((p: any) => p.barcode === trimmed || p.sku === trimmed)
    if (local) {
      setScannedProduct(local)
      setScannedBarcode(trimmed)
      setStockQuantity('')
      setStockCostPrice(String(local.costPrice))
      setStockDialogOpen(true)
      return
    }
    try {
      const { data } = await api.get<Product | null>(`/products/barcode/${encodeURIComponent(trimmed)}`)
      if (data) {
        setScannedProduct(data)
        setScannedBarcode(trimmed)
        setStockQuantity('')
        setStockCostPrice(String(data.costPrice))
        setStockDialogOpen(true)
      } else {
        toast.info(t('toasts.barcodeNotLinked', { barcode: trimmed }))
        openCreate()
        setForm((prev) => ({ ...prev, barcode: trimmed }))
      }
    } catch {
      toast.info(t('toasts.barcodeNotLinked', { barcode: trimmed }))
      openCreate()
      setForm((prev) => ({ ...prev, barcode: trimmed }))
    }
  }

  async function handleFormBarcodeScanned(code: string) {
    const trimmed = code.trim()
    if (!trimmed) return
    const local = products.find((p: any) => p.barcode === trimmed || p.sku === trimmed)
    if (local) {
      closeDialog()
      setScannedProduct(local)
      setScannedBarcode(trimmed)
      setStockQuantity('')
      setStockCostPrice(String(local.costPrice))
      setStockDialogOpen(true)
      toast.info(t('toasts.productExistsAddStock', { name: local.name }))
      return
    }
    try {
      const { data } = await api.get<Product | null>(`/products/barcode/${encodeURIComponent(trimmed)}`)
      if (data) {
        closeDialog()
        setScannedProduct(data)
        setScannedBarcode(trimmed)
        setStockQuantity('')
        setStockCostPrice(String(data.costPrice))
        setStockDialogOpen(true)
        toast.info(t('toasts.productExistsAddStock', { name: data.name }))
        return
      }
    } catch {
      // no existing product for this barcode — fall through to filling the form
    }
    f('barcode', trimmed)
  }

  function closeStockDialog() {
    setStockDialogOpen(false)
    setScannedProduct(null)
    setScannedBarcode('')
    setStockQuantity('')
    setStockCostPrice('')
  }

  function handleAddStock(e: React.FormEvent) {
    e.preventDefault()
    if (!scannedProduct || !stockQuantity) return
    const costPrice = stockCostPrice === '' ? undefined : Number(stockCostPrice)
    incrementStockMutation.mutate({
      productId: scannedProduct.id,
      quantity: Number(stockQuantity),
      ...(costPrice !== undefined && costPrice !== scannedProduct.costPrice ? { costPrice } : {}),
    })
  }

  function handleHwScanKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && hwScanInput.trim()) {
      e.preventDefault()
      handleScannedBarcode(hwScanInput)
      setHwScanInput('')
    }
  }

  function handleFormBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && form.barcode.trim()) {
      e.preventDefault()
      handleFormBarcodeScanned(form.barcode)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { quantity, imageUrl, ...rest } = form
    const payload: any = { ...rest, costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice), brandId: form.brandId || undefined, supplierId: form.supplierId || undefined, barcode: form.barcode || undefined }
    if (editing) { updateMutation.mutate({ id: editing.id, data: payload }) }
    else { createMutation.mutate({ ...payload, quantity: quantity === '' ? undefined : Number(quantity) }) }
  }

  const f = (k: keyof typeof form, v: any) => setForm((prev) => ({ ...prev, [k]: v }))
  const isPending = createMutation.isPending || updateMutation.isPending

  const totalStock = (p: Product) => p.inventory?.quantity ?? 0

  return (
    <div className="flex flex-col flex-1">
      <Header title={t('title')} />
      <div className="flex-1 p-3 md:p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b overflow-x-auto scrollbar-hide">
          {(['products', 'categories', 'brands'] as Tab[]).map((tabKey) => (
            <button key={tabKey} onClick={() => setTab(tabKey)} className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px whitespace-nowrap ${tab === tabKey ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {t(`tabs.${tabKey}`)}
            </button>
          ))}
        </div>

        {/* Products tab */}
        {tab === 'products' && (
          <>
            <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
              <div className="flex items-center gap-2 flex-1 w-full">
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t('list.searchPlaceholder')} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-44"><SelectValue placeholder={t('list.allCategories')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('list.allCategories')}</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={() => router.push('/products/bulk-purchase')} variant="outline" className="whitespace-nowrap">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t('list.bulkPurchase')}
                </Button>
                <div className="relative flex-1 sm:flex-initial sm:w-56">
                  <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('list.scanBarcodePlaceholder')}
                    className="pl-9"
                    value={hwScanInput}
                    onChange={(e) => setHwScanInput(e.target.value)}
                    onKeyDown={handleHwScanKeyDown}
                  />
                </div>
                <Button variant="outline" onClick={() => setScannerOpen(true)} className="hidden sm:flex"><ScanBarcode className="h-4 w-4 mr-2" />{t('list.scanWithCamera')}</Button>
                <Button variant="outline" size="icon" onClick={() => setScannerOpen(true)} className="sm:hidden"><ScanBarcode className="h-4 w-4" /></Button>
                <Button onClick={openCreate} className="whitespace-nowrap"><Plus className="h-4 w-4 mr-2" />{t('list.addProduct')}</Button>
              </div>
            </div>

            <div className="rounded-lg border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[48px]" />
                  <TableHead className="whitespace-nowrap">{t('list.table.product')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('list.table.sku')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('list.table.category')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('list.table.brand')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('list.table.cost')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('list.table.price')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('list.table.stock')}</TableHead>
                    <TableHead className="whitespace-nowrap">{t('list.table.status')}</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={10} className="h-32 text-center text-muted-foreground">{t('list.loading')}</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-1"><Package className="h-5 w-5 opacity-40" /><span>{t('list.noProducts')}</span></div>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <AuthImage
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-9 w-9 rounded object-cover border"
                          fallback={<div className="h-9 w-9 rounded border bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{p.sku}</TableCell>
                      <TableCell><Badge variant="outline">{p.category.name}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{p.brand?.name ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatCurrency(p.costPrice)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.sellingPrice)}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${totalStock(p) === 0 ? 'text-destructive' : totalStock(p) <= 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {totalStock(p)}
                        </span>
                      </TableCell>
                      <TableCell><Badge variant={p.isActive ? 'success' : 'secondary'}>{p.isActive ? t('list.active') : t('list.inactive')}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Categories tab */}
        {tab === 'categories' && (
          <div className="space-y-4 max-w-lg">
            <form onSubmit={(e) => { e.preventDefault(); createCatMutation.mutate(catName) }} className="flex gap-2">
              <Input placeholder={t('categories.namePlaceholder')} value={catName} onChange={(e) => setCatName(e.target.value)} required />
              <Button type="submit" disabled={createCatMutation.isPending}><Plus className="h-4 w-4 mr-1" />{t('categories.add')}</Button>
            </form>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader><TableRow><TableHead>{t('categories.name')}</TableHead><TableHead className="w-[60px]" /></TableRow></TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="h-20 text-center text-muted-foreground">{t('categories.noCategories')}</TableCell></TableRow>
                  ) : categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteCatMutation.mutate(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Brands tab */}
        {tab === 'brands' && (
          <div className="space-y-4 max-w-lg">
            <form onSubmit={(e) => { e.preventDefault(); createBrandMutation.mutate(brandName) }} className="flex gap-2">
              <Input placeholder={t('brands.namePlaceholder')} value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
              <Button type="submit" disabled={createBrandMutation.isPending}><Plus className="h-4 w-4 mr-1" />{t('brands.add')}</Button>
            </form>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader><TableRow><TableHead>{t('brands.name')}</TableHead><TableHead className="w-[60px]" /></TableRow></TableHeader>
                <TableBody>
                  {brands.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="h-20 text-center text-muted-foreground">{t('brands.noBrands')}</TableCell></TableRow>
                  ) : brands.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteBrandMutation.mutate(b.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? t('dialog.editProduct') : t('dialog.addProduct')}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>{t('dialog.productImage')}</Label>
                <div className="flex items-center gap-3">
                  {pendingImage ? (
                    <img src={pendingImage.previewUrl} alt="preview" className="h-16 w-16 rounded object-cover border" />
                  ) : (
                    <AuthImage
                      src={form.imageUrl}
                      alt="preview"
                      className="h-16 w-16 rounded object-cover border"
                      fallback={<div className="h-16 w-16 rounded border bg-muted flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground" /></div>}
                    />
                  )}
                  <div className="flex-1 space-y-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) pickImage(file) }}
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-2 space-y-1.5"><Label>{t('dialog.name')}</Label><Input value={form.name} onChange={(e) => f('name', e.target.value)} required /></div>
              <div className="space-y-1.5"><Label>{t('dialog.sku')}</Label><Input value={form.sku} onChange={(e) => f('sku', e.target.value)} placeholder={t('dialog.skuPlaceholder') || 'Auto-generated if empty'} /></div>
              <div className="space-y-1.5">
                <Label>{t('dialog.barcode')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.barcode}
                    onChange={(e) => f('barcode', e.target.value)}
                    onKeyDown={handleFormBarcodeKeyDown}
                    placeholder={t('dialog.barcodePlaceholder')}
                  />
                  <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setFormScannerOpen(true)} title={t('dialog.scanWithCameraTitle')}>
                    <ScanBarcode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t('dialog.category')}</Label>
                <Select value={form.categoryId} onValueChange={(v) => f('categoryId', v)}>
                  <SelectTrigger><SelectValue placeholder={t('dialog.selectPlaceholder')} /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('dialog.brand')}</Label>
                <Select value={form.brandId} onValueChange={(v) => f('brandId', v)}>
                  <SelectTrigger><SelectValue placeholder={t('dialog.none')} /></SelectTrigger>
                  <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('dialog.supplier')}</Label>
                <Select value={form.supplierId} onValueChange={(v) => f('supplierId', v)}>
                  <SelectTrigger><SelectValue placeholder={t('dialog.none')} /></SelectTrigger>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>{t('dialog.costPrice')}</Label><Input type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => f('costPrice', e.target.value)} required /></div>
              <div className="space-y-1.5"><Label>{t('dialog.sellingPrice')}</Label><Input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => f('sellingPrice', e.target.value)} required /></div>
              {!editing && (
                <div className="space-y-1.5">
                  <Label>{t('dialog.initialStock')}</Label>
                  <Input type="number" min="0" step="1" placeholder="0" value={form.quantity} onChange={(e) => f('quantity', e.target.value)} />
                  <p className="text-xs text-muted-foreground">{t('dialog.appliedToAllBranches')}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={closeDialog}>{t('dialog.cancel')}</Button>
              <Button type="submit" disabled={isPending}>{isPending ? t('dialog.saving') : t('dialog.save')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BarcodeScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => { setScannerOpen(false); handleScannedBarcode(code) }}
      />

      <BarcodeScannerDialog
        open={formScannerOpen}
        onClose={() => setFormScannerOpen(false)}
        onDetected={(code) => { setFormScannerOpen(false); handleFormBarcodeScanned(code) }}
      />

      {/* Add stock dialog (after scanning a known product) */}
      <Dialog open={stockDialogOpen} onOpenChange={(open) => !open && closeStockDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('stockDialog.title')}</DialogTitle></DialogHeader>
          {scannedProduct && (
            <form onSubmit={handleAddStock} className="space-y-3 mt-2">
              <div className="rounded-lg border p-3 space-y-1">
                <div className="font-medium text-sm">{scannedProduct.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{t('stockDialog.barcodeLabel', { barcode: scannedBarcode })}</div>
              </div>
              <div className="space-y-1.5">
                <Label>{t('stockDialog.quantityToAdd')}</Label>
                <Input type="number" min="1" step="1" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>{t('stockDialog.costPrice')}</Label>
                <Input type="number" min="0" step="0.01" value={stockCostPrice} onChange={(e) => setStockCostPrice(e.target.value)} />
                <p className="text-xs text-muted-foreground">{t('stockDialog.costPriceHint')}</p>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={closeStockDialog}>{t('stockDialog.cancel')}</Button>
                <Button type="submit" disabled={!stockQuantity || incrementStockMutation.isPending}>
                  {incrementStockMutation.isPending ? t('stockDialog.adding') : t('stockDialog.addStock')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
