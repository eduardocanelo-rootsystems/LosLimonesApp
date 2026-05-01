import { useRef, useEffect, useCallback, useState } from 'react'
import { Eraser, Check } from 'lucide-react'

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
  existingSignature?: string | null
  width?: number
  height?: number
  readOnly?: boolean
}

export function SignatureCanvas({
  onSave,
  existingSignature,
  width = 420,
  height = 150,
  readOnly = false,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  const fillBackground = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }, [width, height])

  // Inicializar canvas
  useEffect(() => {
    fillBackground()
    if (existingSignature) {
      const img = new Image()
      img.onload = () => canvasRef.current?.getContext('2d')?.drawImage(img, 0, 0, width, height)
      img.src = existingSignature
      setHasDrawn(true)
    }
  }, [existingSignature, fillBackground, width, height])

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e.nativeEvent, canvas)
    isDrawing.current = true
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    e.preventDefault()
  }, [readOnly])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || readOnly) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e.nativeEvent, canvas)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111111'
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasDrawn(true)
    e.preventDefault()
  }, [readOnly])

  const endDraw = useCallback(() => {
    isDrawing.current = false
  }, [])

  const clear = () => {
    fillBackground()
    setHasDrawn(false)
  }

  const save = () => {
    if (!hasDrawn) return
    const dataUrl = canvasRef.current!.toDataURL('image/png')
    onSave(dataUrl)
  }

  return (
    <div className="space-y-2">
      <div
        className="overflow-hidden rounded-lg border border-ink-700 bg-white"
        style={{ width: '100%', maxWidth: width }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
          className={readOnly ? 'cursor-default' : 'cursor-crosshair'}
        />
      </div>
      {!readOnly && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1.5 rounded-md border border-ink-700 px-3 py-1.5 text-xs text-ink-400 hover:border-ink-500 hover:text-ink-200 transition-colors"
          >
            <Eraser className="h-3.5 w-3.5" />
            Limpiar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!hasDrawn}
            className="flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-500 disabled:opacity-40 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            Guardar firma
          </button>
          <span className="text-xs text-ink-500">Dibujá tu firma con el mouse o dedo</span>
        </div>
      )}
    </div>
  )
}
