import Header from '@/components/layouts/Header'
import { getLandingPageContent } from '@/lib/content/queries'
import { getThemeCssVars, getThemeFontVar } from '@/lib/content/theme-provider'

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const content = await getLandingPageContent()
  const cssVars = getThemeCssVars(content.theme)
  const fontVar = getThemeFontVar(content.theme)

  return (
    <div style={{ ...cssVars, '--font-sans': fontVar } as React.CSSProperties}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:p-4 focus:text-dxt-primary"
      >
        Skip to content
      </a>
      <Header logoUrl={content.theme.logoUrl} />
      {children}
    </div>
  )
}
