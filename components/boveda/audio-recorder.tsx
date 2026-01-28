'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Mic, Square, Play, Pause, Save, Trash2, Loader2 } from 'lucide-react'
import { guardarGrabacionAudio } from '@/app/boveda/actions'

interface AudioRecorderProps {
  onSaved?: () => void
  onCancel?: () => void
}

export function AudioRecorder({ onSaved, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [audioUrl])

  // Iniciar grabación
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        // Detener el stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }
      
      mediaRecorder.start(1000) // Recoger datos cada segundo
      setIsRecording(true)
      setDuration(0)
      
      // Timer para mostrar duración
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
      
    } catch (err) {
      console.error('Error accediendo al micrófono:', err)
      setError('No se pudo acceder al micrófono. Verifica los permisos.')
    }
  }, [])

  // Detener grabación
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  // Pausar/Reanudar grabación
  const togglePause = useCallback(() => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) clearInterval(timerRef.current)
      }
      setIsPaused(!isPaused)
    }
  }, [isPaused])

  // Reproducir/Pausar audio
  const togglePlayback = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  // Descartar grabación
  const discardRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setDescripcion('')
    setIsPlaying(false)
  }, [audioUrl])

  // Guardar grabación
  const saveRecording = useCallback(async () => {
    if (!audioBlob) return
    
    setSaving(true)
    setError(null)
    
    try {
      // Convertir blob a base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          resolve(dataUrl.split(',')[1])
        }
      })
      reader.readAsDataURL(audioBlob)
      const base64 = await base64Promise
      
      const result = await guardarGrabacionAudio({
        audioBlob: base64,
        duracionSegundos: duration,
        descripcion: descripcion || undefined
      })
      
      if (result.success) {
        discardRecording()
        onSaved?.()
      } else if (result.requiresAuth) {
        setError('Debes iniciar sesión para guardar grabaciones')
      } else {
        setError(result.error || 'Error al guardar la grabación')
      }
    } catch (err) {
      console.error('Error guardando grabación:', err)
      setError('Error al procesar la grabación')
    } finally {
      setSaving(false)
    }
  }, [audioBlob, duration, descripcion, discardRecording, onSaved])

  // Formatear duración
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="border-2 border-dashed border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mic className="w-5 h-5 text-destructive" />
          Grabación de Audio
        </CardTitle>
        <CardDescription>
          Graba evidencia de audio para tu caso laboral
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visualización de tiempo */}
        <div className="flex items-center justify-center py-4">
          <div className="text-4xl font-mono font-bold tabular-nums">
            {formatDuration(duration)}
          </div>
        </div>
        
        {/* Indicador de grabación */}
        {isRecording && (
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-destructive animate-pulse'}`} />
            <span className="text-sm font-medium">
              {isPaused ? 'Pausado' : 'Grabando...'}
            </span>
          </div>
        )}
        
        {/* Controles de grabación */}
        <div className="flex items-center justify-center gap-3">
          {!isRecording && !audioBlob && (
            <Button
              onClick={startRecording}
              size="lg"
              className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90"
            >
              <Mic className="w-8 h-8" />
            </Button>
          )}
          
          {isRecording && (
            <>
              <Button
                onClick={togglePause}
                size="lg"
                variant="outline"
                className="h-12 w-12 rounded-full bg-transparent"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>
              <Button
                onClick={stopRecording}
                size="lg"
                className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90"
              >
                <Square className="w-6 h-6" />
              </Button>
            </>
          )}
          
          {audioBlob && !isRecording && (
            <>
              <Button
                onClick={togglePlayback}
                size="lg"
                variant="outline"
                className="h-12 w-12 rounded-full bg-transparent"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button
                onClick={discardRecording}
                size="lg"
                variant="outline"
                className="h-12 w-12 rounded-full text-destructive border-destructive/30 bg-transparent"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
        
        {/* Audio player oculto */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
        
        {/* Descripción y guardar */}
        {audioBlob && !isRecording && (
          <div className="space-y-3 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="descripcion-audio">Descripción (opcional)</Label>
              <Textarea
                id="descripcion-audio"
                placeholder="¿De qué trata esta grabación? Ej: Conversación con mi jefe sobre el despido..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={saveRecording}
                disabled={saving}
                className="flex-1 gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Guardando...' : 'Guardar en Bóveda'}
              </Button>
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  disabled={saving}
                  className="bg-transparent"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Error */}
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        
        {/* Nota legal */}
        <p className="text-xs text-muted-foreground text-center">
          Las grabaciones se guardan de forma segura y encriptada en tu bóveda personal.
          Solo tú y tu abogado tendrán acceso.
        </p>
      </CardContent>
    </Card>
  )
}
