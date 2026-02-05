import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Admin | zyncdata',
}

export default function AdminPage() {
  redirect('/admin/systems')
}
