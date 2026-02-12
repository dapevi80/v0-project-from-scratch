import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { GlobalAIAssistant } from '@/components/global-ai-assistant'
import { FloatingBugButton } from '@/components/bug-report/floating-bug-button'
import { AuthProvider } from '@/lib/auth/auth-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'mecorrieron.mx - Tu derecho laboral, protegido',
  description: 'Conectamos trabajadores despedidos con abogados laborales. Calcula tu liquidación según la Ley Federal del Trabajo de México.',
  generator: 'mecorrieron.mx',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-MX">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <GlobalAIAssistant />
          <FloatingBugButton />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
