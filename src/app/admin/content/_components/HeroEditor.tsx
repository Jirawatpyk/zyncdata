'use client'

import { useEffect } from 'react'
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Loader2 } from 'lucide-react'
import { heroContentSchema, type HeroContent } from '@/lib/validations/content'
import { useUpdateSection } from '@/lib/admin/mutations/content'
import { DynamicTipTapEditor } from '@/components/patterns/DynamicTipTapEditor'

interface HeroEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: HeroContent
}

export default function HeroEditor({ open, onOpenChange, content }: HeroEditorProps) {
  const updateSection = useUpdateSection()

  const form = useForm<HeroContent>({
    resolver: zodResolver(heroContentSchema) as Resolver<HeroContent>,
    defaultValues: {
      title: content.title,
      subtitle: content.subtitle,
      description: content.description,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: content.title,
        subtitle: content.subtitle,
        description: content.description,
      })
    }
  }, [open, content, form])

  const onSubmit: SubmitHandler<HeroContent> = async (data) => {
    try {
      await updateSection.mutateAsync({
        section: 'hero',
        content: data as unknown as Record<string, unknown>,
      })
      onOpenChange(false)
    } catch {
      // Error handled by mutation's onError
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]" data-testid="hero-editor-dialog">
        <DialogHeader>
          <DialogTitle>Edit Hero Section</DialogTitle>
          <DialogDescription>
            Update the hero banner content. Changes go live immediately.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="hero-editor-form"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Welcome to zyncdata"
                      data-testid="hero-title-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Smart Platform & Solutions"
                      data-testid="hero-subtitle-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <DynamicTipTapEditor
                      content={field.value}
                      onChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                      placeholder="Enter hero description..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="hero-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
                data-testid="hero-submit-button"
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
