import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { showSuccess, showError } from '../lib/toast'

// ── Types ──

export interface Invoice {
  id: string
  user_id: string
  stripe_invoice_id: string | null
  stripe_invoice_url: string | null
  amount: number // in cents
  currency: string
  status: 'paid' | 'pending' | 'void' | 'draft'
  period_start: string
  period_end: string
  created_at: string
}

export interface BillingInfo {
  id: string
  user_id: string
  company_name: string
  address: string
  vat_number: string | null
  updated_at: string
}

interface UpdateBillingInfoInput {
  companyName: string
  address: string
  vatNumber: string
}

// ── Query keys ──

const INVOICES_KEY = ['invoices'] as const
const BILLING_INFO_KEY = ['billing-info'] as const

// ── Hook ──

export function useInvoices() {
  const queryClient = useQueryClient()

  // Fetch invoices
  const {
    data: invoices,
    isLoading: isLoadingInvoices,
    error: invoicesError,
  } = useQuery({
    queryKey: INVOICES_KEY,
    queryFn: async (): Promise<Invoice[]> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return []

        const { data, error: fetchError } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchError) {
          // Table may not exist yet
          if (
            fetchError.code === '42P01' ||
            fetchError.message?.includes('relation') ||
            fetchError.message?.includes('does not exist')
          ) {
            console.warn('[Invoices] Table not found, skipping')
            return []
          }
          throw fetchError
        }

        return (data ?? []) as Invoice[]
      } catch (err) {
        console.warn('[Invoices] Error fetching:', err)
        return []
      }
    },
    staleTime: 60_000,
    retry: 1,
  })

  // Fetch billing info
  const {
    data: billingInfo,
    isLoading: isLoadingBilling,
    error: billingError,
  } = useQuery({
    queryKey: BILLING_INFO_KEY,
    queryFn: async (): Promise<BillingInfo | null> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error: fetchError } = await supabase
          .from('billing_info')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (fetchError) {
          // Table may not exist yet
          if (
            fetchError.code === '42P01' ||
            fetchError.message?.includes('relation') ||
            fetchError.message?.includes('does not exist')
          ) {
            console.warn('[BillingInfo] Table not found, skipping')
            return null
          }
          throw fetchError
        }

        return data as BillingInfo | null
      } catch (err) {
        console.warn('[BillingInfo] Error fetching:', err)
        return null
      }
    },
    staleTime: 60_000,
    retry: 1,
  })

  // Update billing info (upsert)
  const updateBillingMutation = useMutation({
    mutationFn: async (input: UpdateBillingInfoInput): Promise<BillingInfo> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const { data, error: upsertError } = await supabase
        .from('billing_info')
        .upsert(
          {
            user_id: user.id,
            company_name: input.companyName.trim(),
            address: input.address.trim(),
            vat_number: input.vatNumber.trim() || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()
        .single()

      if (upsertError) {
        if (
          upsertError.code === '42P01' ||
          upsertError.message?.includes('relation') ||
          upsertError.message?.includes('does not exist')
        ) {
          throw new Error(
            'Cette fonctionnalité sera bientôt disponible. La base de données est en cours de configuration.'
          )
        }
        throw upsertError
      }

      return data as BillingInfo
    },
    onSuccess: () => {
      showSuccess('Informations de facturation mises à jour')
      queryClient.invalidateQueries({ queryKey: BILLING_INFO_KEY })
    },
    onError: (err: Error) => {
      showError(err.message || 'Erreur lors de la mise à jour')
    },
  })

  return {
    invoices: invoices ?? [],
    billingInfo: billingInfo ?? null,
    isLoading: isLoadingInvoices || isLoadingBilling,
    isLoadingInvoices,
    isLoadingBilling,
    invoicesError,
    billingError,
    updateBillingInfo: updateBillingMutation.mutateAsync,
    isUpdatingBilling: updateBillingMutation.isPending,
  }
}
