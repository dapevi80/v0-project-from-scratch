'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Building2, 
  Plus, 
  Users, 
  Scale,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react'
import { getDespachos, createDespacho, updateDespacho, addLawyerToDespacho } from '../actions'

interface Despacho {
  id: string
  nombre: string
  razon_social?: string
  rfc?: string
  modelo_negocio: 'B2B' | 'B2BL' | 'B2C'
  status: string
  email?: string
  telefono?: string
  direccion?: string
  comision_porcentaje?: number
  created_at: string
  despacho_abogados?: Array<{
    id: string
    role: string
    is_active: boolean
    lawyer_profiles?: {
      user_id: string
      display_name: string
      status: string
    }
  }>
}

export default function DespachosAdminPage() {
  const [despachos, setDespachos] = useState<Despacho[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newDespacho, setNewDespacho] = useState({
    nombre: '',
    razon_social: '',
    rfc: '',
    modelo_negocio: 'B2C' as const,
    email: '',
    telefono: '',
    direccion: ''
  })
  const [saving, setSaving] = useState(false)
  const [filterModelo, setFilterModelo] = useState<string>('all')

  useEffect(() => {
    loadDespachos()
  }, [filterModelo])

  async function loadDespachos() {
    setLoading(true)
    const filters = filterModelo !== 'all' ? { modelo: filterModelo } : undefined
    const result = await getDespachos(filters)
    if (!result.error && result.data) {
      setDespachos(result.data)
    }
    setLoading(false)
  }

  async function handleCreateDespacho() {
    if (!newDespacho.nombre) return
    
    setSaving(true)
    const result = await createDespacho(newDespacho)
    if (!result.error) {
      setShowNewDialog(false)
      setNewDespacho({
        nombre: '',
        razon_social: '',
        rfc: '',
        modelo_negocio: 'B2C',
        email: '',
        telefono: '',
        direccion: ''
      })
      loadDespachos()
    }
    setSaving(false)
  }

  const modeloColors = {
    'B2B': 'bg-blue-100 text-blue-800',
    'B2BL': 'bg-purple-100 text-purple-800',
    'B2C': 'bg-green-100 text-green-800'
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Despachos de Abogados</h1>
              <p className="text-sm text-muted-foreground">Gestiona los despachos y sus abogados asociados</p>
            </div>
          </div>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Despacho
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Despacho</DialogTitle>
                <DialogDescription>
                  Agrega un nuevo despacho de abogados a la plataforma
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label>Nombre del Despacho *</Label>
                  <Input 
                    value={newDespacho.nombre}
                    onChange={(e) => setNewDespacho(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Bufete Juridico Martinez"
                  />
                </div>
                
                <div>
                  <Label>Razon Social</Label>
                  <Input 
                    value={newDespacho.razon_social}
                    onChange={(e) => setNewDespacho(prev => ({ ...prev, razon_social: e.target.value }))}
                    placeholder="Ej: Martinez y Asociados SC"
                  />
                </div>
                
                <div>
                  <Label>RFC</Label>
                  <Input 
                    value={newDespacho.rfc}
                    onChange={(e) => setNewDespacho(prev => ({ ...prev, rfc: e.target.value.toUpperCase() }))}
                    placeholder="Ej: MAR123456ABC"
                  />
                </div>
                
                <div>
                  <Label>Modelo de Negocio *</Label>
                  <Select 
                    value={newDespacho.modelo_negocio}
                    onValueChange={(v) => setNewDespacho(prev => ({ ...prev, modelo_negocio: v as 'B2B' | 'B2BL' | 'B2C' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B2C">B2C - Directo al trabajador</SelectItem>
                      <SelectItem value="B2B">B2B - Empresa a empresa</SelectItem>
                      <SelectItem value="B2BL">B2BL - Business to Business Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={newDespacho.email}
                      onChange={(e) => setNewDespacho(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Telefono</Label>
                    <Input 
                      value={newDespacho.telefono}
                      onChange={(e) => setNewDespacho(prev => ({ ...prev, telefono: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Direccion</Label>
                  <Input 
                    value={newDespacho.direccion}
                    onChange={(e) => setNewDespacho(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Ciudad, Estado"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateDespacho} disabled={saving || !newDespacho.nombre}>
                  {saving ? 'Creando...' : 'Crear Despacho'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={filterModelo} onValueChange={setFilterModelo}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por modelo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los modelos</SelectItem>
              <SelectItem value="B2C">B2C</SelectItem>
              <SelectItem value="B2B">B2B</SelectItem>
              <SelectItem value="B2BL">B2BL</SelectItem>
            </SelectContent>
          </Select>
          
          <Badge variant="secondary">
            {despachos.length} despachos
          </Badge>
        </div>

        {/* Lista de despachos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : despachos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay despachos registrados</h3>
              <p className="text-muted-foreground mb-4">Crea el primer despacho para comenzar</p>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Despacho
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {despachos.map(despacho => (
              <Card key={despacho.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                        <Building2 className="w-6 h-6" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{despacho.nombre}</h3>
                          <Badge className={modeloColors[despacho.modelo_negocio]}>
                            {despacho.modelo_negocio}
                          </Badge>
                          <Badge variant={despacho.status === 'active' ? 'default' : 'secondary'}>
                            {despacho.status === 'active' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        
                        {despacho.razon_social && (
                          <p className="text-sm text-muted-foreground">{despacho.razon_social}</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {despacho.email && <span>{despacho.email}</span>}
                          {despacho.telefono && <span>{despacho.telefono}</span>}
                          {despacho.rfc && <span>RFC: {despacho.rfc}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{despacho.despacho_abogados?.length || 0}</span>
                          <span className="text-muted-foreground">abogados</span>
                        </div>
                        {despacho.comision_porcentaje && (
                          <p className="text-xs text-muted-foreground">
                            Comision: {despacho.comision_porcentaje}%
                          </p>
                        )}
                      </div>
                      
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/despachos/${despacho.id}`}>
                          Ver detalles
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Lista de abogados */}
                  {despacho.despacho_abogados && despacho.despacho_abogados.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Abogados asociados:</p>
                      <div className="flex flex-wrap gap-2">
                        {despacho.despacho_abogados.slice(0, 5).map(da => (
                          <Badge key={da.id} variant="outline" className="text-xs">
                            <Scale className="w-3 h-3 mr-1" />
                            {da.lawyer_profiles?.display_name || 'Sin nombre'}
                            {da.role === 'owner' && ' (Propietario)'}
                          </Badge>
                        ))}
                        {despacho.despacho_abogados.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{despacho.despacho_abogados.length - 5} mas
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
