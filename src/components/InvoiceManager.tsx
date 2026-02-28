import { useState } from 'react'
import { m } from 'framer-motion'
import {
  FileText,
  Download,
  Building2,
  Loader2,
  CheckCircle,
  ExternalLink,
} from './icons'
import { Card, Button, Input, Badge } from './ui'
import { SectionHeader } from '../pages/settings/SettingsComponents'
import { useInvoices, type Invoice } from '../hooks/useInvoices'

// ── Helpers ──

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function statusLabel(status: Invoice['status']): { text: string; variant: 'success' | 'warning' | 'default' } {
  switch (status) {
    case 'paid':
      return { text: 'Payée', variant: 'success' }
    case 'pending':
      return { text: 'En attente', variant: 'warning' }
    case 'void':
      return { text: 'Annulée', variant: 'default' }
    case 'draft':
      return { text: 'Brouillon', variant: 'default' }
    default:
      return { text: status, variant: 'default' }
  }
}

// ── Invoice Row ──

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const { text: statusText, variant } = statusLabel(invoice.status)

  return (
    <div className="flex items-center justify-between py-3 border-b border-border-default last:border-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-primary-10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {formatDate(invoice.created_at)}
          </p>
          <p className="text-xs text-text-quaternary">
            {formatAmount(invoice.amount, invoice.currency)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={variant} size="sm">
          {statusText}
        </Badge>
        {invoice.stripe_invoice_url ? (
          <a
            href={invoice.stripe_invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-card-hover transition-colors"
            aria-label="Télécharger la facture"
          >
            <Download className="w-4 h-4 text-primary" />
          </a>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center">
            <Download className="w-4 h-4 text-text-quaternary opacity-30" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Billing Info Form ──

function BillingInfoForm({
  initialCompanyName,
  initialAddress,
  initialVatNumber,
  onSave,
  isSaving,
}: {
  initialCompanyName: string
  initialAddress: string
  initialVatNumber: string
  onSave: (companyName: string, address: string, vatNumber: string) => void
  isSaving: boolean
}) {
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [address, setAddress] = useState(initialAddress)
  const [vatNumber, setVatNumber] = useState(initialVatNumber)
  const [saved, setSaved] = useState(false)

  const hasChanges =
    companyName !== initialCompanyName ||
    address !== initialAddress ||
    vatNumber !== initialVatNumber

  const handleSave = () => {
    onSave(companyName, address, vatNumber)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-text-tertiary mb-1.5">Nom de l'entreprise</label>
        <Input
          value={companyName}
          onChange={(e) => {
            setCompanyName(e.target.value)
            setSaved(false)
          }}
          placeholder="Ma Société SAS"
        />
      </div>
      <div>
        <label className="block text-sm text-text-tertiary mb-1.5">Adresse de facturation</label>
        <Input
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setSaved(false)
          }}
          placeholder="123 Rue de la Paix, 75001 Paris"
        />
      </div>
      <div>
        <label className="block text-sm text-text-tertiary mb-1.5">
          Numéro de TVA <span className="text-text-quaternary">(optionnel)</span>
        </label>
        <Input
          value={vatNumber}
          onChange={(e) => {
            setVatNumber(e.target.value)
            setSaved(false)
          }}
          placeholder="FR12345678901"
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        size="sm"
        variant={saved ? 'secondary' : 'primary'}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enregistrement...
          </>
        ) : saved ? (
          <>
            <CheckCircle className="w-4 h-4 text-success" />
            Enregistré
          </>
        ) : (
          'Enregistrer'
        )}
      </Button>
    </div>
  )
}

// ── Main Component ──

export function InvoiceManager() {
  const {
    invoices,
    billingInfo,
    isLoading,
    updateBillingInfo,
    isUpdatingBilling,
  } = useInvoices()

  if (isLoading) {
    return (
      <Card className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
        <SectionHeader icon={FileText} title="Facturation entreprise" />
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm text-text-tertiary">Chargement...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
      <SectionHeader icon={FileText} title="Facturation entreprise" />

      {/* Invoices list */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-secondary mb-3">Historique de facturation</h3>

        {invoices.length > 0 ? (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl bg-surface-card border border-border-default divide-y divide-border-default px-4"
          >
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </m.div>
        ) : (
          <div className="rounded-xl bg-surface-card border border-border-default p-6 text-center">
            <FileText className="w-8 h-8 text-text-quaternary mx-auto mb-2" />
            <p className="text-sm text-text-tertiary">Aucune facture pour le moment</p>
            <p className="text-xs text-text-quaternary mt-1">
              Les factures apparaîtront ici après ton premier paiement
            </p>
          </div>
        )}

        {/* Stripe portal link */}
        <a
          href="https://billing.stripe.com/p/login/test"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:text-primary-hover transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Gérer mon abonnement sur Stripe
        </a>
      </div>

      {/* Billing info form */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-text-tertiary" />
          <h3 className="text-sm font-semibold text-text-secondary">
            Informations de facturation
          </h3>
        </div>
        <p className="text-xs text-text-quaternary mb-4">
          Ces informations seront ajoutées à tes prochaines factures.
        </p>

        <BillingInfoForm
          initialCompanyName={billingInfo?.company_name ?? ''}
          initialAddress={billingInfo?.address ?? ''}
          initialVatNumber={billingInfo?.vat_number ?? ''}
          onSave={(companyName, address, vatNumber) =>
            updateBillingInfo({ companyName, address, vatNumber })
          }
          isSaving={isUpdatingBilling}
        />
      </div>
    </Card>
  )
}

export default InvoiceManager
