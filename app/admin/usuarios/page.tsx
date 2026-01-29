'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Ban,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MatrixRain } from '@/components/ui/matrix-rain'

interface Usuario {
  id: string
  full_name: string
  email: string
  role: string
  phone?: string
  estado?: string
  created_at: string
  last_sign_in_at?: string
  status: 'active' | 'inactive' | 'suspended'
}

interface Stats {
  total: number
  activos: number
  inactivos: number
  suspendidos: number
  abogados: number
  clientes: number
  admins: number
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    activos: 0,
    inactivos: 0,
    suspendidos: 0,
    abogados: 0,
    clientes: 0,
    admins: 0
  })
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  
  // Modal
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterUsuarios()
  }, [usuarios, searchTerm, roleFilter, statusFilter])

  async function loadData() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.replace('/acceso')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['superadmin', 'webagent'].includes(profile.role)) {
      router.replace('/admin')
      return
    }

    setIsSuperAdmin(true)

    // Cargar usuarios
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profiles) {
      const visibleProfiles = profile.role === 'webagent'
        ? profiles.filter(p => p.role !== 'superadmin')
        : profiles
      const usuariosFormateados: Usuario[] = visibleProfiles.map(p => ({
        id: p.id,
        full_name: p.full_name || 'Sin nombre',
        email: p.email || '',
        role: p.role || 'user',
        phone: p.phone,
        estado: p.estado,
        created_at: p.created_at,
        last_sign_in_at: p.last_sign_in_at,
        status: p.suspended ? 'suspended' : (p.last_sign_in_at ? 'active' : 'inactive')
      }))
      
      setUsuarios(usuariosFormateados)
      
      // Calcular stats
      setStats({
        total: usuariosFormateados.length,
        activos: usuariosFormateados.filter(u => u.status === 'active').length,
        inactivos: usuariosFormateados.filter(u => u.status === 'inactive').length,
        suspendidos: usuariosFormateados.filter(u => u.status === 'suspended').length,
        abogados: usuariosFormateados.filter(u => u.role === 'abogado' || u.role === 'lawyer').length,
        clientes: usuariosFormateados.filter(u => ['user', 'cliente', 'worker', 'guest'].includes(u.role)).length,
        admins: usuariosFormateados.filter(u => u.role === 'admin' || u.role === 'superadmin').length
      })
    }

    setLoading(false)
  }

  function filterUsuarios() {
    let filtered = [...usuarios]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(u => 
        u.full_name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.phone?.includes(term)
      )
    }
    
    if (roleFilter !== 'todos') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }
    
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(u => u.status === statusFilter)
    }
    
    setFilteredUsuarios(filtered)
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-purple-900 text-purple-300 border border-purple-500">SUPERADMIN</Badge>
      case 'admin':
        return <Badge className="bg-blue-900 text-blue-300 border border-blue-500">ADMIN</Badge>
      case 'abogado':
        return <Badge className="bg-green-900 text-green-300 border border-green-500">ABOGADO</Badge>
      default:
        return <Badge className="bg-gray-900 text-gray-300 border border-gray-500">CLIENTE</Badge>
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-950 text-green-400">Activo</Badge>
      case 'inactive':
        return <Badge className="bg-yellow-950 text-yellow-400">Inactivo</Badge>
      case 'suspended':
        return <Badge className="bg-red-950 text-red-400">Suspendido</Badge>
      default:
        return <Badge className="bg-gray-950 text-gray-400">Desconocido</Badge>
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: string) {
    setActionLoading(true)
    const supabase = createClient()
    
    const newSuspended = currentStatus !== 'suspended'
    
    await supabase
      .from('profiles')
      .update({ suspended: newSuspended })
      .eq('id', userId)
    
    // Actualizar localmente
    setUsuarios(prev => prev.map(u => 
      u.id === userId ? { ...u, status: newSuspended ? 'suspended' : 'active' } : u
    ))
    
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, status: newSuspended ? 'suspended' : 'active' } : null)
    }
    
    setActionLoading(false)
  }

  async function changeUserRole(userId: string, newRole: string) {
    setActionLoading(true)
    const supabase = createClient()
    
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    
    setUsuarios(prev => prev.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ))
    
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, role: newRole } : null)
    }
    
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <MatrixRain />
        <div className="text-green-500 font-mono animate-pulse z-10">Cargando usuarios...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      <MatrixRain />
      
      {/* Header */}
      <header className="bg-black/95 border-b border-green-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-green-500 hover:bg-green-950 font-mono px-2 sm:px-3">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Admin</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-sm sm:text-xl font-bold text-green-400 font-mono flex items-center gap-1 sm:gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                USUARIOS
              </h1>
              <p className="text-green-700 text-[10px] sm:text-sm font-mono hidden sm:block">Gestion de usuarios</p>
            </div>
          </div>
          <Badge className="bg-green-950 text-green-400 border border-green-600 font-mono text-[10px] sm:text-xs px-1.5 sm:px-2">
            ROOT
          </Badge>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          <Card className="bg-green-950/30 border-green-800">
            <CardContent className="p-2 sm:p-3 text-center">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-base sm:text-xl font-bold text-green-400 font-mono">{stats.total}</div>
              <div className="text-[8px] sm:text-[10px] text-green-700">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-green-950/30 border-green-800">
            <CardContent className="p-2 sm:p-3 text-center">
              <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-base sm:text-xl font-bold text-emerald-400 font-mono">{stats.activos}</div>
              <div className="text-[8px] sm:text-[10px] text-green-700">Activos</div>
            </CardContent>
          </Card>
          <Card className="bg-green-950/30 border-green-800">
            <CardContent className="p-2 sm:p-3 text-center">
              <UserX className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-base sm:text-xl font-bold text-yellow-400 font-mono">{stats.inactivos}</div>
              <div className="text-[8px] sm:text-[10px] text-green-700">Inact.</div>
            </CardContent>
          </Card>
          <Card className="bg-green-950/30 border-green-800">
            <CardContent className="p-2 sm:p-3 text-center">
              <Ban className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-base sm:text-xl font-bold text-red-400 font-mono">{stats.suspendidos}</div>
              <div className="text-[8px] sm:text-[10px] text-green-700">Susp.</div>
            </CardContent>
          </Card>
          <Card className="bg-green-950/30 border-green-800 hidden md:block">
            <CardContent className="p-2 sm:p-3 text-center">
              <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-base sm:text-xl font-bold text-blue-400 font-mono">{stats.abogados}</div>
              <div className="text-[8px] sm:text-[10px] text-green-700">Abogados</div>
            </CardContent>
          </Card>
          <Card className="bg-green-950/30 border-green-800 hidden md:block">
            <CardContent className="p-2 sm:p-3 text-center">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-base sm:text-xl font-bold text-gray-400 font-mono">{stats.clientes}</div>
              <div className="text-[8px] sm:text-[10px] text-green-700">Clientes</div>
            </CardContent>
          </Card>
          <Card className="bg-green-950/30 border-green-800 hidden md:block">
            <CardContent className="p-2 sm:p-3 text-center">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-base sm:text-xl font-bold text-purple-400 font-mono">{stats.admins}</div>
              <div className="text-[8px] sm:text-[10px] text-green-700">Admins</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-green-950/30 border-green-800 mb-3 sm:mb-4">
          <CardContent className="p-2 sm:p-4">
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 sm:pl-10 bg-black border-green-800 text-green-400 placeholder:text-green-800 font-mono text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
              <div className="flex gap-1.5 sm:gap-3">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="flex-1 sm:w-32 bg-black border-green-800 text-green-400 font-mono text-xs sm:text-sm h-8 sm:h-10">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-800">
                    <SelectItem value="todos" className="text-green-400 text-xs sm:text-sm">Todos</SelectItem>
                    <SelectItem value="superadmin" className="text-purple-400 text-xs sm:text-sm">Super</SelectItem>
                    <SelectItem value="admin" className="text-blue-400 text-xs sm:text-sm">Admin</SelectItem>
                    <SelectItem value="abogado" className="text-green-400 text-xs sm:text-sm">Abogado</SelectItem>
                    <SelectItem value="user" className="text-gray-400 text-xs sm:text-sm">Cliente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1 sm:w-32 bg-black border-green-800 text-green-400 font-mono text-xs sm:text-sm h-8 sm:h-10">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-800">
                    <SelectItem value="todos" className="text-green-400 text-xs sm:text-sm">Todos</SelectItem>
                    <SelectItem value="active" className="text-green-400 text-xs sm:text-sm">Activos</SelectItem>
                    <SelectItem value="inactive" className="text-yellow-400 text-xs sm:text-sm">Inactivos</SelectItem>
                    <SelectItem value="suspended" className="text-red-400 text-xs sm:text-sm">Suspendidos</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadData}
                  className="border-green-600 text-green-400 hover:bg-green-950 font-mono bg-transparent h-8 sm:h-10 px-2 sm:px-3"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de usuarios */}
        <Card className="bg-green-950/30 border-green-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[320px]">
                <thead className="bg-green-950/50 border-b border-green-800">
                  <tr className="text-green-500 font-mono text-[10px] sm:text-xs">
                    <th className="text-left p-2 sm:p-3">Usuario</th>
                    <th className="text-left p-2 sm:p-3 hidden md:table-cell">Email</th>
                    <th className="text-center p-2 sm:p-3">Rol</th>
                    <th className="text-center p-2 sm:p-3 hidden sm:table-cell">Estado</th>
                    <th className="text-center p-2 sm:p-3 hidden md:table-cell">Registro</th>
                    <th className="text-center p-2 sm:p-3">Acc.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 sm:py-8 text-green-700 font-mono text-xs">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ) : (
                    filteredUsuarios.map((usuario) => (
                      <tr 
                        key={usuario.id} 
                        className="border-b border-green-900/50 hover:bg-green-950/30 transition-colors"
                      >
                        <td className="p-2 sm:p-3">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-900 flex items-center justify-center text-green-400 font-mono text-[10px] sm:text-xs flex-shrink-0">
                              {usuario.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-green-300 font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{usuario.full_name}</p>
                              <p className="text-green-700 text-[10px] md:hidden truncate">{usuario.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-3 hidden md:table-cell">
                          <span className="text-green-500 font-mono text-[10px] sm:text-xs">{usuario.email}</span>
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          {getRoleBadge(usuario.role)}
                        </td>
                        <td className="p-2 sm:p-3 text-center hidden sm:table-cell">
                          {getStatusBadge(usuario.status)}
                        </td>
                        <td className="p-2 sm:p-3 text-center hidden md:table-cell">
                          <span className="text-green-700 font-mono text-[10px] sm:text-xs">
                            {new Date(usuario.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-500 hover:bg-green-950 h-6 w-6 sm:h-8 sm:w-8 p-0"
                              onClick={() => {
                                setSelectedUser(usuario)
                                setShowUserDialog(true)
                              }}
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-6 w-6 sm:h-8 sm:w-8 p-0 ${
                                usuario.status === 'suspended' 
                                  ? 'text-green-500 hover:bg-green-950' 
                                  : 'text-red-500 hover:bg-red-950'
                              }`}
                              onClick={() => toggleUserStatus(usuario.id, usuario.status)}
                              disabled={usuario.role === 'superadmin'}
                            >
                              {usuario.status === 'suspended' ? (
                                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              ) : (
                                <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer de tabla */}
            <div className="p-2 sm:p-3 border-t border-green-900 flex justify-between items-center">
              <span className="text-green-700 font-mono text-[10px] sm:text-xs">
                {filteredUsuarios.length}/{usuarios.length} usuarios
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Terminal Footer */}
        <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-black border border-green-900 rounded font-mono text-[10px] sm:text-xs text-green-700">
          <span className="text-green-500">root@ccl</span>$ <span className="animate-pulse">_</span>
        </div>
      </main>

      {/* Dialog de usuario */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="bg-black border border-green-800 text-green-400 max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-green-400 font-mono flex items-center gap-2 text-sm sm:text-base">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              DETALLE
            </DialogTitle>
            <DialogDescription className="text-green-700 font-mono text-xs sm:text-sm">
              ID: {selectedUser?.id.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-3 sm:space-y-4">
              {/* Avatar y nombre */}
              <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-green-950/30 rounded border border-green-800">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-900 flex items-center justify-center text-green-400 font-mono text-xl sm:text-2xl flex-shrink-0">
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-green-300 font-bold text-sm sm:text-lg truncate">{selectedUser.full_name}</h3>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-green-950/30 rounded border border-green-900">
                  <Mail className="w-4 h-4 text-green-600" />
                  <span className="text-green-500 text-sm font-mono">{selectedUser.email}</span>
                </div>
                {selectedUser.phone && (
                  <div className="flex items-center gap-2 p-2 bg-green-950/30 rounded border border-green-900">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="text-green-500 text-sm font-mono">{selectedUser.phone}</span>
                  </div>
                )}
                {selectedUser.estado && (
                  <div className="flex items-center gap-2 p-2 bg-green-950/30 rounded border border-green-900">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-green-500 text-sm font-mono">{selectedUser.estado}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 p-2 bg-green-950/30 rounded border border-green-900">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="text-green-500 text-sm font-mono">
                    Registro: {new Date(selectedUser.created_at).toLocaleDateString('es-MX')}
                  </span>
                </div>
              </div>

              {/* Cambiar rol */}
              {selectedUser.role !== 'superadmin' && (
                <div className="p-3 bg-green-950/30 rounded border border-green-800">
                  <label className="text-green-600 text-xs font-mono block mb-2">Cambiar Rol:</label>
                  <Select 
                    value={selectedUser.role} 
                    onValueChange={(value) => changeUserRole(selectedUser.id, value)}
                    disabled={actionLoading}
                  >
                    <SelectTrigger className="bg-black border-green-800 text-green-400 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-green-800">
                      <SelectItem value="user" className="text-gray-400">Cliente</SelectItem>
                      <SelectItem value="abogado" className="text-green-400">Abogado</SelectItem>
                      <SelectItem value="admin" className="text-blue-400">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2">
                {selectedUser.role !== 'superadmin' && (
                  <Button
                    className={`flex-1 font-mono ${
                      selectedUser.status === 'suspended'
                        ? 'bg-green-700 hover:bg-green-600'
                        : 'bg-red-700 hover:bg-red-600'
                    }`}
                    onClick={() => toggleUserStatus(selectedUser.id, selectedUser.status)}
                    disabled={actionLoading}
                  >
                    {selectedUser.status === 'suspended' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        REACTIVAR
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4 mr-2" />
                        SUSPENDER
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 border-green-600 text-green-400 hover:bg-green-950 font-mono bg-transparent"
                  onClick={() => setShowUserDialog(false)}
                >
                  CERRAR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
