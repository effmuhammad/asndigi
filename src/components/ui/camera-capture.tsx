"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, RotateCcw, Check, X } from "lucide-react"
import { toast } from "sonner"

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onCancel?: () => void
  className?: string
}

export function CameraCapture({ onCapture, onCancel, className = "" }: CameraCaptureProps) {
  const [isActive, setIsActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", // Front camera for selfie
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      setStream(mediaStream)
      setIsActive(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast.error("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsActive(false)
    setCapturedImage(null)
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedImage(imageUrl)
        
        // Create file from blob
        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: "image/jpeg"
        })
        
        // Stop camera after capture
        stopCamera()
        onCapture(file)
      }
    }, "image/jpeg", 0.8)
  }, [stopCamera, onCapture])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    startCamera()
  }, [startCamera])

  const handleCancel = useCallback(() => {
    stopCamera()
    if (onCancel) {
      onCancel()
    }
  }, [stopCamera, onCancel])

  if (capturedImage) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured selfie"
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={retakePhoto}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Foto Ulang
              </Button>
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Batal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isActive) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover rounded-lg bg-gray-100"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                onClick={capturePhoto}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Ambil Foto
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Batal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="font-medium">Ambil Foto Selfie</h3>
            <p className="text-sm text-muted-foreground">
              Klik tombol di bawah untuk mengaktifkan kamera
            </p>
          </div>
          <Button
            type="button"
            onClick={startCamera}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Aktifkan Kamera
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}