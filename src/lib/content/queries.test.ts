import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getLandingPageContent } from '@/lib/content/queries'

describe('getLandingPageContent', () => {
  const mockSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSelect.mockResolvedValue({
      data: [
        {
          section_name: 'hero',
          content: {
            title: 'DxT AI Platform',
            subtitle: 'Enterprise Access Management',
            description: 'Your centralized hub.',
          },
        },
        {
          section_name: 'intro',
          content: {
            heading: 'About DxT AI',
            body: 'DxT AI builds intelligent solutions.',
          },
        },
        {
          section_name: 'systems',
          content: {
            heading: 'Our Systems',
            subtitle: 'Access all your enterprise AI tools from one place',
          },
        },
        {
          section_name: 'footer',
          content: {
            copyright: '2026 DxT AI. All rights reserved.',
            contact_email: 'support@dxt-ai.com',
            links: [],
          },
        },
      ],
      error: null,
    })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should query landing_page_content with correct columns', async () => {
    await getLandingPageContent()

    expect(mockSelect).toHaveBeenCalledWith('section_name, content')
  })

  it('should return structured content map with hero, intro, systems, footer', async () => {
    const result = await getLandingPageContent()

    expect(result.hero).toEqual({
      title: 'DxT AI Platform',
      subtitle: 'Enterprise Access Management',
      description: 'Your centralized hub.',
    })
    expect(result.intro).toEqual({
      heading: 'About DxT AI',
      body: 'DxT AI builds intelligent solutions.',
    })
    expect(result.systems).toEqual({
      heading: 'Our Systems',
      subtitle: 'Access all your enterprise AI tools from one place',
    })
    expect(result.footer).toEqual({
      copyright: '2026 DxT AI. All rights reserved.',
      contactEmail: 'support@dxt-ai.com',
      links: [],
    })
  })

  it('should throw on Supabase error', async () => {
    mockSelect.mockResolvedValue({
      data: null,
      error: { message: 'Query failed' },
    })

    await expect(getLandingPageContent()).rejects.toThrow()
  })

  it('should throw on invalid content shape (Zod validation)', async () => {
    mockSelect.mockResolvedValue({
      data: [
        {
          section_name: 'hero',
          content: { title: 'DxT' },
        },
        {
          section_name: 'intro',
          content: { heading: 'About', body: 'Text' },
        },
        {
          section_name: 'systems',
          content: { heading: 'Systems', subtitle: 'Subtitle' },
        },
        {
          section_name: 'footer',
          content: {
            copyright: '2026',
            contact_email: 'support@dxt-ai.com',
            links: [],
          },
        },
      ],
      error: null,
    })

    await expect(getLandingPageContent()).rejects.toThrow()
  })
})
