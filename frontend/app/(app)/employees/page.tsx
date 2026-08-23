'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Plus, Search, Pencil, UserX, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import api from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'MANAGER' | 'CASHIER'
  phone?: string
  isActive: boolean
  branch?: { id: string; name: string }
}

interface Branch {
  id: string
  name: string
}

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'warning'> = {
  OWNER: 'default',
  MANAGER: 'warning',
  CASHIER: 'secondary',
  ADMIN: 'default',
  SUPER_ADMIN: 'default',
}

const defaultForm = { name: '', email: '', password: '', role: 'CASHIER', phone: '', branchId: '' }

export default function EmployeesPage() {
  const t = useTranslations('employees')
  const tc = useTranslations()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState(defaultForm)

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/users', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success(t('list.toasts.created')); closeDialog() },
    onError: (e: any) => toast.error(e.response?.data?.message ?? t('list.toasts.createFailed')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) => api.patch(`/users/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success(t('list.toasts.updated')); closeDialog() },
    onError: (e: any) => toast.error(e.response?.data?.message ?? t('list.toasts.updateFailed')),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/users/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: () => toast.error(t('list.toasts.statusFailed')),
  })

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() { setEditingUser(null); setForm(defaultForm); setDialogOpen(true) }
  function openEdit(user: User) {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone ?? '', branchId: user.branch?.id ?? '' })
    setDialogOpen(true)
  }
  function closeDialog() { setDialogOpen(false); setEditingUser(null); setForm(defaultForm) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingUser) {
      const payload: Partial<typeof form> = { name: form.name, email: form.email, role: form.role, phone: form.phone, branchId: form.branchId }
      if (form.password) payload.password = form.password
      updateMutation.mutate({ id: editingUser.id, data: payload })
    } else {
      createMutation.mutate(form)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col flex-1">
      <Header title={t('list.title')} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('list.searchPlaceholder')} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('list.addButton')}
          </Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('list.table.name')}</TableHead>
                <TableHead>{t('list.table.email')}</TableHead>
                <TableHead>{t('list.table.role')}</TableHead>
                <TableHead>{t('list.table.branch')}</TableHead>
                <TableHead>{t('list.table.phone')}</TableHead>
                <TableHead>{t('list.table.status')}</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">{t('list.loading')}</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">{t('list.empty')}</TableCell></TableRow>
              ) : filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell><Badge variant={ROLE_VARIANTS[user.role]}>{t(`list.roles.${user.role}`)}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{user.branch?.name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{user.phone ?? '—'}</TableCell>
                  <TableCell><Badge variant={user.isActive ? 'success' : 'secondary'}>{user.isActive ? t('list.status.active') : t('list.status.inactive')}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleMutation.mutate({ id: user.id, isActive: !user.isActive })}>
                        {user.isActive ? <UserX className="h-3.5 w-3.5 text-destructive" /> : <UserCheck className="h-3.5 w-3.5 text-emerald-500" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? t('list.dialog.editTitle') : t('list.dialog.addTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t('list.dialog.fields.fullName')}</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{tc('common.email')}</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{editingUser ? t('list.dialog.fields.newPassword') : t('list.dialog.fields.password')}</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingUser} minLength={8} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('list.dialog.fields.role')}</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">{t('list.roles.OWNER')}</SelectItem>
                    <SelectItem value="MANAGER">{t('list.roles.MANAGER')}</SelectItem>
                    <SelectItem value="CASHIER">{t('list.roles.CASHIER')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('list.dialog.fields.branch')}</Label>
                <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                  <SelectTrigger><SelectValue placeholder={t('list.dialog.fields.branchPlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">{tc('common.phone')}</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>{tc('actions.cancel')}</Button>
              <Button type="submit" disabled={isPending}>{isPending ? t('list.dialog.saving') : tc('actions.save')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
