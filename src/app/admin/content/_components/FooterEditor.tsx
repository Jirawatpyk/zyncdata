'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray, type SubmitHandler, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import type { FooterContent } from '@/lib/validations/content'
import { useUpdateSection } from '@/lib/admin/mutations/content'

// Form schema: uses camelCase contactEmail (matches the transformed FooterContent type)
const footerFormSchema = z.object({
  copyright: z.string().min(1, 'Copyright is required'),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  links: z.array(z.object({
    label: z.string().min(1, 'Label is required'),
    url: z.string().min(1, 'URL is required'),
  })),
})

type FooterFormValues = z.infer<typeof footerFormSchema>

interface FooterEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: FooterContent
}

export default function FooterEditor({ open, onOpenChange, content }: FooterEditorProps) {
  const updateSection = useUpdateSection()

  const form = useForm<FooterFormValues>({
    resolver: zodResolver(footerFormSchema) as Resolver<FooterFormValues>,
    defaultValues: {
      copyright: content.copyright,
      contactEmail: content.contactEmail ?? '',
      links: content.links,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'links',
  })

  useEffect(() => {
    if (open) {
      form.reset({
        copyright: content.copyright,
        contactEmail: content.contactEmail ?? '',
        links: content.links,
      })
    }
  }, [open, content, form])

  const onSubmit: SubmitHandler<FooterFormValues> = async (data) => {
    try {
      // Send camelCase to API — API route handles reverse transform to snake_case for DB
      await updateSection.mutateAsync({
        section: 'footer',
        content: {
          copyright: data.copyright,
          contactEmail: data.contactEmail || undefined,
          links: data.links,
        },
      })
      onOpenChange(false)
    } catch {
      // Error handled by mutation's onError
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[525px]" data-testid="footer-editor-dialog">
        <DialogHeader>
          <DialogTitle>Edit Footer Section</DialogTitle>
          <DialogDescription>
            Update footer content including copyright and contact info.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="footer-editor-form"
          >
            <FormField
              control={form.control}
              name="copyright"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Copyright *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="2026 zyncdata. All rights reserved."
                      data-testid="footer-copyright-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@example.com"
                      data-testid="footer-email-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Links</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ label: '', url: '' })}
                  data-testid="add-link-button"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Link
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-2"
                  data-testid={`link-item-${index}`}
                >
                  <FormField
                    control={form.control}
                    name={`links.${index}.label`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Label" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`links.${index}.url`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="mt-1"
                    data-testid={`remove-link-${index}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="footer-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                data-testid="footer-submit-button"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
