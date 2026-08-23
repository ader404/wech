'use client'

import { useRef, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer, Download, MessageCircle, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { ReceiptContent, ReceiptSale, ReceiptSettings, ReceiptTranslations } from './receipt-content'

import enReceipt from '@/i18n/translations/en/receipt.json'
import frReceipt from '@/i18n/translations/fr/receipt.json'
import arReceipt from '@/i18n/translations/ar/receipt.json'

interface ReceiptDialogProps {
  sale: ReceiptSale | null
  onClose: () => void
}

const DEFAULT_SETTINGS: ReceiptSettings = {
  companyName: 'My Store',
  currency: 'USD',
  receiptFooter: 'Thank you for your business!',
  showLogoOnReceipt: true,
  receiptLocale: 'en',
  showPhoneOnReceipt: true,
  showEmailOnReceipt: true,
  showAddressOnReceipt: true,
  showTaxIdOnReceipt: true,
}

const RECEIPT_TRANSLATIONS: Record<string, any> = {
  en: enReceipt,
  fr: frReceipt,
  ar: arReceipt,
}

export function ReceiptDialog({ sale, onClose }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)

  const { data: settings = DEFAULT_SETTINGS } = useQuery<ReceiptSettings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
    enabled: !!sale,
  })

  const translations: ReceiptTranslations = useMemo(() => {
    const locale = settings.receiptLocale || 'en'
    const t = RECEIPT_TRANSLATIONS[locale] || RECEIPT_TRANSLATIONS.en

    return {
      date: t.date,
      cashier: t.cashier,
      customer: t.customer,
      phone: t.phone,
      paymentMethod: t.paymentMethod,
      item: t.item,
      qty: t.qty,
      price: t.price,
      disc: t.disc,
      total: t.total,
      subtotal: t.subtotal,
      discount: t.discount,
      tax: t.tax,
      amountPaid: t.amountPaid,
      amountDue: t.amountDue,
      paymentStatus: t.paymentStatus,
      paymentMethods: {
        CASH: t.paymentMethods.CASH,
        CARD: t.paymentMethods.CARD,
        BANK_TRANSFER: t.paymentMethods.BANK_TRANSFER,
        QR: t.paymentMethods.QR,
      },
      paymentStatuses: {
        PAID: t.paymentStatuses.PAID,
        PARTIALLY_PAID: t.paymentStatuses.PARTIALLY_PAID,
        UNPAID: t.paymentStatuses.UNPAID,
      },
    }
  }, [settings.receiptLocale])

  function handlePrint() {
    const node = receiptRef.current
    if (!node) return
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) { toast.error('Allow pop-ups to print the receipt'); return }
    printWindow.document.write(`
      <html>
        <head>
          <title>${sale?.invoiceNumber ?? 'Receipt'}</title>
          <style>
            @media print { @page { margin: 0; } body { margin: 0; } }
            body { font-family: ui-monospace, monospace; }
          </style>
        </head>
        <body>${node.outerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 250)
  }

  async function generatePdfBlob(): Promise<Blob | null> {
    const node = receiptRef.current
    if (!node) return null
    const { default: html2canvas } = await import('html2canvas')
    const { jsPDF } = await import('jspdf')
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
    return pdf.output('blob')
  }

  async function handleDownloadPdf() {
    setGenerating(true)
    try {
      const blob = await generatePdfBlob()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${sale?.invoiceNumber ?? 'sale'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  function buildShareText() {
    if (!sale) return ''
    const lines = [
      `${settings.companyName} — Receipt`,
      `Invoice: ${sale.invoiceNumber}`,
      ...sale.items.map((i) => `${i.quantity} x ${i.product.name} — ${formatCurrency(i.total)}`),
      `Total: ${formatCurrency(sale.total)}`,
      settings.receiptFooter,
    ]
    return lines.join('\n')
  }

  function handleShareWhatsApp() {
    const text = encodeURIComponent(buildShareText())
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function handleShareGmail() {
    const subject = encodeURIComponent(`Receipt ${sale?.invoiceNumber ?? ''} — ${settings.companyName}`)
    const body = encodeURIComponent(buildShareText())
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank')
  }

  return (
    <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>
        {sale && (
          <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden max-h-[50vh] overflow-y-auto">
              <ReceiptContent ref={receiptRef} sale={sale} settings={settings} translations={translations} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-3.5 w-3.5 mr-2" />Print</Button>
              <Button variant="outline" size="sm" disabled={generating} onClick={handleDownloadPdf}><Download className="h-3.5 w-3.5 mr-2" />{generating ? 'Generating...' : 'Download PDF'}</Button>
              <Button variant="outline" size="sm" onClick={handleShareWhatsApp}><MessageCircle className="h-3.5 w-3.5 mr-2" />WhatsApp</Button>
              <Button variant="outline" size="sm" onClick={handleShareGmail}><Mail className="h-3.5 w-3.5 mr-2" />Gmail</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
