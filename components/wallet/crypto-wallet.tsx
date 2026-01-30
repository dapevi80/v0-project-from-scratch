'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Wallet, 
  Copy, 
  Check, 
  Send, 
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  CheckCircle2,
  LogOut,
  Trash2,
  KeyRound,
  ChevronRight,
  ChevronLeft,
  Info
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { ProVCard, ProVCardMini } from './pro-vcard'

// Types
interface WalletData {
  address: string
  privateKey: string
  mnemonic: string
}

interface CryptoWalletProps {
  userId?: string
  isVerified: boolean
  onWalletCreated?: (address: string) => void
  // For VCard feature
  userRole?: string
  profile?: {
    id: string
    full_name: string
    email?: string
    phone?: string
    role: string
  }
  lawyerProfile?: {
    cedula_profesional?: string
    firma_digital?: boolean
    firma_url?: string
    firm_name?: string
    photo_url?: string
    bio?: string
    status?: string
    universidad?: string
    especialidad?: string
    direccion_oficina?: string
    horario_atencion?: string
  } | null
}

type WalletView = 'main' | 'receive' | 'send' | 'settings' | 'mnemonic' | 'import' | 'vcard'

// Tutorial steps for wallet creation
const SECURITY_STEPS = [
  {
    title: 'Que es tu cartera?',
    description: 'Tu cartera digital personal donde solo TU tienes acceso mediante 12 palabras secretas.',
    icon: Wallet,
    tip: 'Piensa en ella como una caja fuerte digital'
  },
  {
    title: 'Las 12 palabras son tu llave',
    description: 'Al crear tu cartera recibiras 12 palabras. Son tu UNICA forma de recuperarla. Si las pierdes, pierdes tus fondos PARA SIEMPRE.',
    icon: KeyRound,
    tip: 'Escribelas en papel, NUNCA en digital'
  },
  {
    title: 'Nunca las compartas',
    description: 'NADIE legitimo te pedira tu frase. Ni nosotros, ni soporte. Quien la pida es estafador.',
    icon: AlertTriangle,
    tip: 'Ni fotos, ni capturas, ni mensajes'
  },
  {
    title: 'No las guardamos',
    description: 'Tu frase se genera en tu dispositivo. No la almacenamos ni podemos recuperarla. Tu eres responsable.',
    icon: Shield,
    tip: 'Descentralizada = tu control total'
  }
]

export function CryptoWallet({ userId, isVerified, onWalletCreated, userRole, profile, lawyerProfile }: CryptoWalletProps) {
  // Check if user is eligible for VCard (lawyer, admin, superadmin with verified status)
  const isVCardEligible = profile && (userRole === 'lawyer' || userRole === 'admin' || userRole === 'superadmin') && lawyerProfile?.status === 'verified'
  // States
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [balance, setBalance] = useState<string>('0.00')
  const [hideBalance, setHideBalance] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [showMnemonicBackup, setShowMnemonicBackup] = useState(false)
  const [mnemonicConfirmed, setMnemonicConfirmed] = useState(false)
  const [confirmWords, setConfirmWords] = useState<string[]>(['', '', ''])
  const [currentView, setCurrentView] = useState<WalletView>('main')
  const [sendAddress, setSendAddress] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importMnemonic, setImportMnemonic] = useState('')
  const [showImportOption, setShowImportOption] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const balanceNumber = Number.parseFloat(balance) || 0
  const mxnRate = 17.5
  const mxnBalance = balanceNumber * mxnRate

  const nftAssets = [
    {
      title: 'Cupones',
      description: 'Bonos intercambiables por monedas o suscripciones.',
      requiresVerification: false
    },
    {
      title: 'Monedas IA',
      description: 'Creditos para usar herramientas inteligentes.',
      requiresVerification: true
    },
    {
      title: 'VCard profesional',
      description: 'Tarjeta de presentacion verificable.',
      requiresVerification: false
    },
    {
      title: 'Llave digital SAT',
      description: 'Certificados y llaves firmadas por el SAT.',
      requiresVerification: false
    },
    {
      title: 'Firma digital',
      description: 'Autenticacion de documentos legales.',
      requiresVerification: true
    },
    {
      title: 'Contraseñas seguras',
      description: 'Vault cifrado para credenciales.',
      requiresVerification: false
    }
  ]

  // Check for existing wallet in localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      const savedWallet = localStorage.getItem(`wallet_${userId}`)
      if (savedWallet) {
        try {
          const parsed = JSON.parse(savedWallet)
          setWalletData(parsed)
          setMnemonicConfirmed(true)
        } catch {
          // Invalid saved wallet
        }
      }
      // Check hide balance preference
      const hideBalancePref = localStorage.getItem(`wallet_hide_balance_${userId}`)
      if (hideBalancePref === 'true') setHideBalance(true)
    }
  }, [userId])

  // Fetch balance when wallet is loaded
  useEffect(() => {
    if (walletData?.address && mnemonicConfirmed) {
      fetchBalance(walletData.address)
    }
  }, [walletData?.address, mnemonicConfirmed])

  // Save hide balance preference
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`wallet_hide_balance_${userId}`, hideBalance.toString())
    }
  }, [hideBalance, userId])

  // Generate wallet using ethers.js
  const generateWallet = async (): Promise<WalletData> => {
    const { ethers } = await import('ethers')
    const wallet = ethers.Wallet.createRandom()
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || ''
    }
  }

  // Import wallet from mnemonic
  const importWalletFromMnemonic = async (mnemonic: string): Promise<WalletData | null> => {
    try {
      const { ethers } = await import('ethers')
      const wallet = ethers.Wallet.fromPhrase(mnemonic.trim())
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic.trim()
      }
    } catch {
      return null
    }
  }

  // Fetch USDT balance on Polygon
  const fetchBalance = async (address: string) => {
    setIsLoading(true)
    try {
      const { ethers } = await import('ethers')
      const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com')
      const usdtAddress = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
      const usdtAbi = ['function balanceOf(address) view returns (uint256)']
      const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, provider)
      const balanceWei = await usdtContract.balanceOf(address)
      const balanceFormatted = ethers.formatUnits(balanceWei, 6)
      setBalance(parseFloat(balanceFormatted).toFixed(2))
    } catch (err) {
      console.error('Error fetching balance:', err)
      setBalance('0.00')
    } finally {
      setIsLoading(false)
    }
  }

  // Start wallet creation process
  const startWalletCreation = () => {
    setShowTutorial(true)
    setTutorialStep(0)
    setShowImportOption(false)
  }

  // Handle tutorial navigation
  const nextTutorialStep = () => {
    if (tutorialStep < SECURITY_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1)
    } else {
      createWallet()
    }
  }

  // Create the actual wallet
  const createWallet = async () => {
    setIsCreating(true)
    setError(null)
    try {
      const newWallet = await generateWallet()
      setWalletData(newWallet)
      setShowTutorial(false)
      setShowMnemonicBackup(true)
    } catch (err) {
      setError('Error al crear la cartera. Intenta de nuevo.')
      console.error('Wallet creation error:', err)
    } finally {
      setIsCreating(false)
    }
  }

  // Handle import wallet
  const handleImportWallet = async () => {
    setIsCreating(true)
    setError(null)
    try {
      const words = importMnemonic.trim().split(/\s+/)
      if (words.length !== 12) {
        setError('La frase debe tener exactamente 12 palabras')
        setIsCreating(false)
        return
      }
      const imported = await importWalletFromMnemonic(importMnemonic)
      if (imported) {
        setWalletData(imported)
        setMnemonicConfirmed(true)
        setCurrentView('main')
        setShowImportOption(false)
        if (userId) {
          localStorage.setItem(`wallet_${userId}`, JSON.stringify(imported))
        }
        onWalletCreated?.(imported.address)
      } else {
        setError('Frase semilla invalida. Verifica las palabras.')
      }
    } catch {
      setError('Error al importar cartera.')
    } finally {
      setIsCreating(false)
    }
  }

  // Confirm mnemonic backup
  const confirmMnemonicBackup = () => {
    if (!walletData?.mnemonic) return
    const words = walletData.mnemonic.split(' ')
    const checkPositions = [0, 4, 8]
    const isCorrect = checkPositions.every((pos, idx) => 
      confirmWords[idx].toLowerCase().trim() === words[pos].toLowerCase()
    )
    if (isCorrect) {
      setMnemonicConfirmed(true)
      setShowMnemonicBackup(false)
      if (userId) {
        localStorage.setItem(`wallet_${userId}`, JSON.stringify(walletData))
      }
      onWalletCreated?.(walletData.address)
      setError(null)
    } else {
      setError('Las palabras no coinciden. Verifica tu frase.')
    }
  }

  // Logout wallet (keep data but lock)
  const logoutWallet = () => {
    setMnemonicConfirmed(false)
    setWalletData(null)
    setCurrentView('main')
  }

  // Delete wallet completely
  const deleteWallet = () => {
    if (userId) {
      localStorage.removeItem(`wallet_${userId}`)
      localStorage.removeItem(`wallet_hide_balance_${userId}`)
    }
    setWalletData(null)
    setMnemonicConfirmed(false)
    setDeleteConfirm(false)
    setCurrentView('main')
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // === RENDER FUNCTIONS ===

  // Not verified state
  if (!isVerified) {
    return (
      <Card className="border-dashed border-2 border-muted bg-muted/10">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-muted-foreground text-base sm:text-lg">Cartera digital</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Verifica tu cuenta para activar cripto</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground text-sm sm:text-base">Cartera bloqueada</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 px-4">
                Verifica tu cuenta para crear tu cartera y usar USDT + Monedas IA
              </p>
            </div>
            <Button variant="outline" size="sm" className="bg-transparent">
              Verificar cuenta
            </Button>
          </div>
          <div className="border-t pt-4 space-y-3">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">Activos disponibles sin verificacion</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Cupones, vCards, llaves y contraseñas se pueden recibir sin cuenta verificada.
              </p>
            </div>
            <div className="grid gap-2">
              {nftAssets.filter((asset) => !asset.requiresVerification).map((asset) => (
                <div key={asset.title} className="flex items-start gap-2 rounded-lg border border-muted p-2">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-foreground">{asset.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{asset.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] sm:text-[10px]">NFT</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Tutorial Modal
  if (showTutorial) {
    const currentStep = SECURITY_STEPS[tutorialStep]
    const StepIcon = currentStep.icon
    return (
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <Badge className="bg-amber-500 text-white text-xs">
              {tutorialStep + 1} / {SECURITY_STEPS.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setShowTutorial(false)} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <StepIcon className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-amber-900">{currentStep.title}</h3>
              <p className="text-sm sm:text-base text-amber-800 leading-relaxed">{currentStep.description}</p>
              <div className="inline-flex items-center gap-1 bg-amber-100 rounded-full px-3 py-1">
                <Info className="w-3 h-3 text-amber-600" />
                <span className="text-xs text-amber-700">{currentStep.tip}</span>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-amber-200 rounded-full h-1.5">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((tutorialStep + 1) / SECURITY_STEPS.length) * 100}%` }}
            />
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            {tutorialStep > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setTutorialStep(tutorialStep - 1)}
                className="flex-1 bg-transparent h-11 sm:h-12"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Atras
              </Button>
            )}
            <Button 
              onClick={nextTutorialStep}
              disabled={isCreating}
              className="flex-1 bg-amber-600 hover:bg-amber-700 h-11 sm:h-12"
              size="sm"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Creando...
                </>
              ) : tutorialStep === SECURITY_STEPS.length - 1 ? (
                <>Crear cartera</>
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show mnemonic for backup
  if (showMnemonicBackup && walletData) {
    const words = walletData.mnemonic.split(' ')
    return (
      <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <CardTitle className="text-red-900 text-base sm:text-lg">Guarda tu frase semilla</CardTitle>
          </div>
          <CardDescription className="text-red-700 text-xs sm:text-sm">
            Escribe estas 12 palabras EN ORDEN. Es tu UNICA forma de recuperar tu cartera.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          {/* Mnemonic grid - responsive */}
          <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-red-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {words.map((word, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-1.5 sm:gap-2 bg-red-50 rounded-lg px-2 sm:px-3 py-2"
                >
                  <span className="text-[10px] sm:text-xs text-red-400 font-mono w-4 sm:w-5">{idx + 1}.</span>
                  <span className="font-mono text-xs sm:text-sm text-red-900">{word}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-red-100 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-red-800 font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              NUNCA compartas estas palabras ni las guardes en fotos o mensajes.
            </p>
          </div>
          
          {/* Confirmation */}
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm font-medium text-foreground">
              Confirma ingresando las palabras indicadas:
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[1, 5, 9].map((pos, idx) => (
                <div key={pos}>
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">#{pos}</Label>
                  <Input
                    type="text"
                    value={confirmWords[idx]}
                    onChange={(e) => {
                      const newWords = [...confirmWords]
                      newWords[idx] = e.target.value
                      setConfirmWords(newWords)
                      setError(null)
                    }}
                    placeholder={`Palabra ${pos}`}
                    className="mt-1 text-sm h-10"
                  />
                </div>
              ))}
            </div>
            {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
            <Button 
              onClick={confirmMnemonicBackup}
              className="w-full bg-red-600 hover:bg-red-700 h-11 sm:h-12"
            >
              Confirmar y activar cartera
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Import wallet view
  if (currentView === 'import' || showImportOption) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-blue-900 text-base sm:text-lg">Importar cartera</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setCurrentView('main'); setShowImportOption(false); }} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Ingresa tu frase de 12 palabras para restaurar tu cartera
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div>
            <Label className="text-xs sm:text-sm">Frase semilla (12 palabras)</Label>
            <textarea
              value={importMnemonic}
              onChange={(e) => { setImportMnemonic(e.target.value); setError(null); }}
              placeholder="palabra1 palabra2 palabra3 ..."
              className="mt-2 w-full h-24 sm:h-28 p-3 text-sm font-mono border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Separa cada palabra con un espacio</p>
          </div>
          {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
          <Button 
            onClick={handleImportWallet}
            disabled={isCreating || !importMnemonic.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 h-11 sm:h-12"
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Importando...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 mr-2" />
                Importar cartera
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Main view - No wallet yet
  if (!walletData || !mnemonicConfirmed) {
    return (
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-emerald-900 text-base sm:text-lg">Cartera USDT</CardTitle>
                <CardDescription className="text-xs sm:text-sm">USDT + MXN estimado</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs hidden sm:inline-flex">
              Descentralizada
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-center py-6 sm:py-8 space-y-4 sm:space-y-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-emerald-900 text-sm sm:text-base">Activa tu cartera</p>
              <p className="text-xs sm:text-sm text-emerald-700 max-w-[280px] mx-auto">
                Crea tu cartera descentralizada para recibir USDT, monedas IA y recompensas
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:gap-3 max-w-[280px] mx-auto">
              <Button 
                onClick={startWalletCreation}
                className="bg-emerald-600 hover:bg-emerald-700 h-11 sm:h-12 w-full"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Crear nueva cartera
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowImportOption(true)}
                className="bg-transparent border-emerald-300 text-emerald-700 h-10 sm:h-11 w-full"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Tengo una cartera
              </Button>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              100% descentralizada - Tu controlas tus claves
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Receive view
  if (currentView === 'receive') {
    return (
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-emerald-900 text-base sm:text-lg">Recibir USDT</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('main')} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription className="text-xs sm:text-sm">Red Polygon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <div className="flex justify-center">
            <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-lg">
              <QRCodeSVG 
                value={walletData.address} 
                size={160}
                level="H"
                includeMargin
                className="sm:hidden"
              />
              <QRCodeSVG 
                value={walletData.address} 
                size={200}
                level="H"
                includeMargin
                className="hidden sm:block"
              />
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-emerald-200">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">Tu direccion</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[10px] sm:text-xs font-mono break-all text-foreground leading-relaxed">
                {walletData.address}
              </code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(walletData.address)} className="h-8 w-8 p-0 flex-shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-[10px] sm:text-xs text-amber-800">
              <strong>Solo USDT en Polygon.</strong> Otros tokens o redes = perdida de fondos.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Send view
  if (currentView === 'send') {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-blue-900 text-base sm:text-lg">Enviar USDT</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('main')} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-blue-200">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Saldo disponible</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{balance} USDT</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs sm:text-sm">Direccion destino</Label>
              <Input
                type="text"
                placeholder="0x..."
                value={sendAddress}
                onChange={(e) => setSendAddress(e.target.value)}
                className="mt-1 font-mono text-sm h-10 sm:h-11"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Cantidad USDT</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="mt-1 text-sm h-10 sm:h-11"
              />
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-[10px] sm:text-xs text-amber-800">
              Necesitas MATIC para gas (~$0.01). Proximamente disponible.
            </p>
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 sm:h-12" disabled>
            <Send className="w-4 h-4 mr-2" />
            Enviar (Proximamente)
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Settings/Mnemonic view
  if (currentView === 'mnemonic') {
    const words = walletData.mnemonic.split(' ')
    return (
      <Card className="border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-600" />
              <CardTitle className="text-slate-900 text-base sm:text-lg">Seguridad</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('main')} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {/* Frase semilla */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm font-medium">Frase semilla</Label>
              <Badge variant="outline" className="text-[10px]">Solo tu puedes verla</Badge>
            </div>
            <div className="bg-red-50 rounded-xl p-3 sm:p-4 border border-red-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {words.map((word, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-white rounded px-2 py-1.5">
                    <span className="text-[10px] text-red-400 font-mono w-4">{idx + 1}.</span>
                    <span className="font-mono text-xs text-red-900">{word}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cerrar sesion */}
          <Button 
            variant="outline" 
            onClick={logoutWallet}
            className="w-full bg-transparent h-10 sm:h-11"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesion de cartera
          </Button>

          {/* Eliminar wallet */}
          <div className="pt-3 border-t">
            {!deleteConfirm ? (
              <Button 
                variant="ghost" 
                onClick={() => setDeleteConfirm(true)}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 h-10 sm:h-11"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar cartera de este dispositivo
              </Button>
            ) : (
              <div className="space-y-2 bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-xs text-red-800 font-medium">Seguro? Solo podras recuperarla con tu frase semilla.</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(false)} className="flex-1 h-9 bg-transparent">
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={deleteWallet} className="flex-1 bg-red-600 hover:bg-red-700 h-9">
                    Si, eliminar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // VCard view for verified professionals
  if (currentView === 'vcard' && isVCardEligible && profile) {
    return (
      <ProVCard 
        profile={profile}
        lawyerProfile={lawyerProfile}
        onClose={() => setCurrentView('main')}
      />
    )
  }

  // Main wallet view (wallet active)
  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-emerald-900 text-base sm:text-lg">Mi Cartera</CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs sm:text-sm">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Polygon
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchBalance(walletData.address)}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('mnemonic')}
              className="h-8 w-8 p-0"
            >
              <Shield className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        {/* Balance */}
        <div className="bg-white/70 rounded-xl p-4 sm:p-5 border border-emerald-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Saldo disponible en MXN</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHideBalance(!hideBalance)}
              className="h-6 w-6 p-0"
            >
              {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-emerald-700">
              {hideBalance ? '••••' : mxnBalance.toFixed(2)}
            </span>
            <span className="text-lg sm:text-xl font-semibold text-emerald-600">MXN</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {hideBalance ? 'USDT ••••' : `USDT ${balance}`}
          </p>
        </div>
        
        {/* Address */}
        <div className="bg-white/70 rounded-xl p-3 sm:p-4 border border-emerald-100">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5">Mi direccion</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs sm:text-sm font-mono truncate text-foreground">
              {walletData.address.slice(0, 8)}...{walletData.address.slice(-6)}
            </code>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(walletData.address)} className="h-8 w-8 p-0">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Button 
            onClick={() => setCurrentView('receive')}
            className="bg-emerald-600 hover:bg-emerald-700 h-11 sm:h-12"
          >
            <ArrowDownLeft className="w-4 h-4 mr-1.5 sm:mr-2" />
            Recibir
          </Button>
          <Button 
            onClick={() => setCurrentView('send')}
            variant="outline"
            className="bg-transparent border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-11 sm:h-12"
          >
            <ArrowUpRight className="w-4 h-4 mr-1.5 sm:mr-2" />
            Enviar
          </Button>
        </div>

        <div className="space-y-3 pt-2 border-t border-emerald-200">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-emerald-900">NFTs en tu Cartera</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Cada activo se emite como NFT desde Superadmin para su dispersion segura.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {nftAssets.map((asset) => (
              <div key={asset.title} className="rounded-lg border border-emerald-100 bg-white/70 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-medium text-emerald-900">{asset.title}</p>
                  <Badge variant="outline" className="text-[9px] sm:text-[10px]">
                    NFT
                  </Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{asset.description}</p>
                <p className="text-[10px] sm:text-xs mt-2">
                  {asset.requiresVerification ? (
                    <span className="text-amber-700">Requiere verificacion</span>
                  ) : (
                    <span className="text-emerald-700">Disponible sin verificacion</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* VCard Profesional - Solo para abogados/admin/superadmin verificados */}
        {isVCardEligible && profile && (
          <div className="pt-2 border-t border-emerald-200">
            <ProVCardMini 
              profile={profile}
              lawyerProfile={lawyerProfile}
              onExpand={() => setCurrentView('vcard')}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
