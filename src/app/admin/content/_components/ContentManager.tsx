'use client'

import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { contentQueryOptions } from '@/lib/admin/queries/content'
import SectionCard from './SectionCard'
import HeroEditor from './HeroEditor'
import PillarsEditor from './PillarsEditor'
import FooterEditor from './FooterEditor'

type EditingSection = 'hero' | 'pillars' | 'footer' | null

export default function ContentManager() {
  const { data: content } = useSuspenseQuery(contentQueryOptions)
  const [editingSection, setEditingSection] = useState<EditingSection>(null)

  const heroPreview = content.hero
    ? `${content.hero.title} — ${content.hero.subtitle}`
    : ''

  const pillarsPreview = content.pillars
    ? `${content.pillars.heading}: ${content.pillars.items.map((i) => i.title).join(', ')}`
    : ''

  const footerPreview = content.footer
    ? `${content.footer.copyright}${content.footer.contactEmail ? ` | ${content.footer.contactEmail}` : ''}`
    : ''

  return (
    <div data-testid="content-manager">
      <div className="space-y-4">
        <SectionCard
          sectionName="hero"
          title="Hero"
          preview={heroPreview}
          onEdit={() => setEditingSection('hero')}
        />
        <SectionCard
          sectionName="pillars"
          title="Pillars"
          preview={pillarsPreview}
          onEdit={() => setEditingSection('pillars')}
        />
        <SectionCard
          sectionName="footer"
          title="Footer"
          preview={footerPreview}
          onEdit={() => setEditingSection('footer')}
        />
      </div>

      <HeroEditor
        open={editingSection === 'hero'}
        onOpenChange={(open) => !open && setEditingSection(null)}
        content={content.hero}
      />
      <PillarsEditor
        open={editingSection === 'pillars'}
        onOpenChange={(open) => !open && setEditingSection(null)}
        content={content.pillars}
      />
      <FooterEditor
        open={editingSection === 'footer'}
        onOpenChange={(open) => !open && setEditingSection(null)}
        content={content.footer}
      />
    </div>
  )
}
