import type { Metadata } from 'next'
import { Nunito, Inter, Open_Sans } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-inter',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-open-sans',
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
    <html lang="en" className={`${nunito.variable} ${inter.variable} ${openSans.variable}`}>
      <body className="font-nunito antialiased">{children}</body>
    </html>
  )
}
