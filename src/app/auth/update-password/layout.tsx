import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set New Password | zyncdata',
  description: 'Set a new password for your zyncdata account',
}

export default function UpdatePasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
