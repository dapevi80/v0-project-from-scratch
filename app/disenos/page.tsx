'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MecorrieronSkinPreview } from './skins/mecorrieron/preview'
import { AfiliadosSkinPreview } from './skins/afiliados/preview'

export default function DisenosPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-3 px-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-semibold">Vista de diseños</h1>
            <p className="text-xs text-muted-foreground">Comparativo de skins sin funcionalidades activas.</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <MecorrieronSkinPreview />
        <AfiliadosSkinPreview />
      </main>
    </div>
  )
}
