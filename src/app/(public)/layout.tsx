import Header from '@/components/layouts/Header'

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:p-4 focus:text-dxt-primary"
      >
        Skip to content
      </a>
      <Header />
      {children}
    </>
  )
}
