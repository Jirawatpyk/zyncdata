import { useMutation, useQueryClient } from '@tanstack/react-query'
import { unwrapResponse } from '@/lib/admin/queries/api-adapter'
import { toast } from 'sonner'

interface BrandingUrlResponse {
  logoUrl?: string | null
  faviconUrl?: string | null
}

export function useUploadLogo() {
  const queryClient = useQueryClient()

  return useMutation<BrandingUrlResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/branding/logo', {
        method: 'POST',
        body: formData,
      })
      return unwrapResponse<BrandingUrlResponse>(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] })
      toast.success('Logo uploaded')
    },
    onError: () => {
      toast.error('Failed to upload logo')
    },
  })
}

export function useDeleteLogo() {
  const queryClient = useQueryClient()

  return useMutation<BrandingUrlResponse, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/branding/logo', {
        method: 'DELETE',
      })
      return unwrapResponse<BrandingUrlResponse>(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] })
      toast.success('Logo removed')
    },
    onError: () => {
      toast.error('Failed to remove logo')
    },
  })
}

export function useUploadFavicon() {
  const queryClient = useQueryClient()

  return useMutation<BrandingUrlResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/branding/favicon', {
        method: 'POST',
        body: formData,
      })
      return unwrapResponse<BrandingUrlResponse>(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] })
      toast.success('Favicon uploaded')
    },
    onError: () => {
      toast.error('Failed to upload favicon')
    },
  })
}

export function useDeleteFavicon() {
  const queryClient = useQueryClient()

  return useMutation<BrandingUrlResponse, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/branding/favicon', {
        method: 'DELETE',
      })
      return unwrapResponse<BrandingUrlResponse>(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] })
      toast.success('Favicon removed')
    },
    onError: () => {
      toast.error('Failed to remove favicon')
    },
  })
}
