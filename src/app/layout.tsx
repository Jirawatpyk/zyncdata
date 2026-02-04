import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: 'zyncdata',
  description: 'DxT AI Enterprise Access Management Platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-nunito antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
