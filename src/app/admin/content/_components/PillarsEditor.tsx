'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray, type SubmitHandler, type Resolver } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { pillarsContentSchema, type PillarsContent } from '@/lib/validations/content'
import { useUpdateSection } from '@/lib/admin/mutations/content'

const ICON_OPTIONS = [
  'Shield', 'Zap', 'BarChart3', 'Globe', 'Lock',
  'Server', 'Database', 'Cloud', 'Cpu', 'Activity',
  'Settings', 'Users', 'Monitor', 'Layers', 'CheckCircle',
]

interface PillarsEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: PillarsContent
}

export default function PillarsEditor({ open, onOpenChange, content }: PillarsEditorProps) {
  const updateSection = useUpdateSection()

  const form = useForm<PillarsContent>({
    resolver: zodResolver(pillarsContentSchema) as Resolver<PillarsContent>,
    defaultValues: {
      heading: content.heading,
      items: content.items.map((item) => ({
        title: item.title,
        description: item.description,
        url: item.url,
        icon: item.icon,
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  useEffect(() => {
    if (open) {
      form.reset({
        heading: content.heading,
        items: content.items.map((item) => ({
          title: item.title,
          description: item.description,
          url: item.url,
          icon: item.icon,
        })),
      })
    }
  }, [open, content, form])

  const onSubmit: SubmitHandler<PillarsContent> = async (data) => {
    try {
      await updateSection.mutateAsync({
        section: 'pillars',
        content: data as unknown as Record<string, unknown>,
      })
      onOpenChange(false)
    } catch {
      // Error handled by mutation's onError
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]" data-testid="pillars-editor-dialog">
        <DialogHeader>
          <DialogTitle>Edit Pillars Section</DialogTitle>
          <DialogDescription>
            Update the pillars content. At least one pillar is required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="pillars-editor-form"
          >
            <FormField
              control={form.control}
              name="heading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Heading *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Our Pillars"
                      data-testid="pillars-heading-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Pillar Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ title: '', description: '', url: null, icon: '' })}
                  data-testid="add-pillar-button"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Pillar
                </Button>
              </div>

              {form.formState.errors.items?.root && (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {form.formState.errors.items.root.message}
                </p>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-3 rounded-lg border p-4"
                  data-testid={`pillar-item-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pillar {index + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        data-testid={`remove-pillar-${index}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Remove pillar {index + 1}</span>
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Pillar title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Pillar description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.icon`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                          value={field.value ?? 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {ICON_OPTIONS.map((icon) => (
                              <SelectItem key={icon} value={icon}>
                                {icon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="pillars-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
                data-testid="pillars-submit-button"
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
