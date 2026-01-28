import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MeCorrieron.mx - Reclama tu liquidacion justa',
  description: 'Te ayudamos a calcular y reclamar la indemnizacion que te corresponde por despido injustificado. Abogados laborales expertos en Mexico.',
  keywords: 'despido injustificado, liquidacion, indemnizacion laboral, abogado laboral, derechos laborales mexico',
  openGraph: {
    title: 'MeCorrieron.mx - Reclama tu liquidacion justa',
    description: 'Calcula tu liquidacion gratis y conecta con abogados laborales expertos.',
    url: 'https://mecorrieron.mx',
    siteName: 'MeCorrieron.mx',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MeCorrieron.mx',
    description: 'Calcula tu liquidacion gratis y reclama lo que te corresponde.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#991b1b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
