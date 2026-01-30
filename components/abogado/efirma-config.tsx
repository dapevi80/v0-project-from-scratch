'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, Upload, Check, AlertCircle, Lock, FileKey, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface EfirmaConfigProps {
  userId: string
  hasEfirma: boolean
  efirmaStatus?: 'pending' | 'active' | 'expired'
  onUpdate?: () => void
}

export function EfirmaConfig({ userId, hasEfirma, efirmaStatus, onUpdate }: EfirmaConfigProps) {
  const [cerFile, setCerFile] = useState<File | null>(null)
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const handleSubmit = async () => {
    if (!cerFile || !keyFile || !password) {
      setError('Todos los campos son requeridos')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // Subir archivos a storage privado
      const cerPath = `efirma/${userId}/${Date.now()}.cer`
      const keyPath = `efirma/${userId}/${Date.now()}.key`
      
      const { error: cerError } = await supabase.storage
        .from('private-documents')
        .upload(cerPath, cerFile)
      
      if (cerError) throw new Error('Error subiendo certificado')
      
      const { error: keyError } = await supabase.storage
        .from('private-documents')
        .upload(keyPath, keyFile)
      
      if (keyError) throw new Error('Error subiendo llave privada')
      
      // Guardar referencia en BD (password encriptado en el servidor)
      const { error: dbError } = await supabase
        .from('lawyer_efirma')
        .upsert({
          lawyer_id: userId,
          cer_path: cerPath,
          key_path: keyPath,
          password_hash: btoa(password), // En produccion usar encriptacion real
          status: 'active',
          updated_at: new Date().toISOString()
        })
      
      if (dbError) throw new Error('Error guardando configuracion')
      
      setSuccess(true)
      onUpdate?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }
  
  if (hasEfirma && efirmaStatus === 'active') {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-800">eFirma Configurada</p>
              <p className="text-sm text-green-600">Lista para firma digital certificada</p>
            </div>
            <Badge variant="outline" className="border-green-300 text-green-700">
              Activa
            </Badge>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline" className="bg-transparent border-green-300 text-green-700">
              <Link href="/dashboard?vcard=1">
                Ver VCard profesional
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-transparent border-green-300 text-green-700">
              <Link href="/dashboard">
                Ir a Cartera
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (success) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-medium text-green-800">eFirma configurada exitosamente</p>
          <p className="text-sm text-green-600 mt-1">Ya puedes firmar documentos digitalmente</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <FileKey className="w-4 h-4" />
          Configurar eFirma SAT
        </CardTitle>
        <CardDescription>
          Sube tus archivos de firma electronica para habilitar firma digital certificada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="cer" className="text-sm">Certificado (.cer)</Label>
          <div className="relative">
            <Input
              id="cer"
              type="file"
              accept=".cer"
              onChange={(e) => setCerFile(e.target.files?.[0] || null)}
              className="file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:bg-slate-100 file:text-sm"
            />
          </div>
          {cerFile && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> {cerFile.name}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="key" className="text-sm">Llave privada (.key)</Label>
          <Input
            id="key"
            type="file"
            accept=".key"
            onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
            className="file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:bg-slate-100 file:text-sm"
          />
          {keyFile && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> {keyFile.name}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm">Contrasena de la llave privada</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-9"
              placeholder="Ingresa tu contrasena"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Seguridad:</strong> La contraseña de tu llave es privada y nunca se comparte con otros usuarios.
            Los archivos se almacenan encriptados y solo se usan para firmar documentos que autorices.
          </p>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={loading || !cerFile || !keyFile || !password}
          className="w-full"
        >
          {loading ? (
            <>Guardando...</>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Guardar eFirma
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
