import type { ReactNode } from 'react'

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
}

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return children
}
