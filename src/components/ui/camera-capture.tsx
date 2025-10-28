"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, RotateCcw, X } from "lucide-react"
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
  const [isLoading, setIsLoading] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Clean up stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // Wait for video element to be available before starting camera
  const waitForVideoElement = useCallback((): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      const checkVideoRef = () => {
        if (videoRef.current) {
          resolve(videoRef.current)
        } else {
          // Check again after a short delay
          setTimeout(checkVideoRef, 50)
        }
      }
      
      // Start checking immediately
      checkVideoRef()
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error("Video element tidak tersedia setelah 5 detik"))
      }, 5000)
    })
  }, [])

  const setupVideoEvents = useCallback((video: HTMLVideoElement) => {
    // Add multiple event listeners for debugging
    video.onloadstart = () => {
      console.log("🎥 Video loadstart event")
      setDebugInfo("Video mulai dimuat...")
    }
    
    video.onloadeddata = () => {
      console.log("🎥 Video loadeddata event")
      setDebugInfo("Data video dimuat...")
    }
    
    video.onloadedmetadata = () => {
      console.log("🎥 Video loadedmetadata event")
      console.log("🎥 Video dimensions:", video.videoWidth, "x", video.videoHeight)
      setDebugInfo("Metadata video dimuat...")
      setVideoReady(true)
      setIsLoading(false)
    }
    
    video.oncanplay = () => {
      console.log("🎥 Video canplay event")
      setDebugInfo("Video siap diputar...")
      setVideoReady(true)
      setIsLoading(false)
    }
    
    video.onplay = () => {
      console.log("🎥 Video play event")
      setDebugInfo("Video sedang diputar...")
      setVideoReady(true)
      setIsLoading(false)
    }
    
    video.onplaying = () => {
      console.log("🎥 Video playing event")
      setDebugInfo("Video berhasil diputar!")
      setVideoReady(true)
      setIsLoading(false)
    }
    
    // Handle video error
    video.onerror = (error) => {
      console.error("🎥 Video element error:", error)
      setDebugInfo("Error pada elemen video")
      toast.error("Gagal memuat video dari kamera")
      setIsLoading(false)
    }
  }, [])

  const startCamera = useCallback(async () => {
    console.log("🎥 Starting camera...")
    setIsLoading(true)
    setVideoReady(false)
    setDebugInfo("Memulai kamera...")
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia tidak didukung oleh browser ini")
      }

      console.log("🎥 Requesting camera access...")
      setDebugInfo("Meminta akses kamera...")

      const constraints = {
        video: { 
          facingMode: "user", // Front camera for selfie
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      }

      console.log("🎥 Camera constraints:", constraints)

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      console.log("🎥 Got media stream:", mediaStream)
      console.log("🎥 Video tracks:", mediaStream.getVideoTracks())
      
      setStream(mediaStream)
      setIsActive(true)
      setDebugInfo("Stream diperoleh, menunggu video element...")
      
      // Wait for video element to be available
      try {
        console.log("🎥 Waiting for video element...")
        const video = await waitForVideoElement()
        
        console.log("🎥 Video element found, setting up...")
        setDebugInfo("Video element ditemukan, mengatur...")
        
        // Setup event listeners
        setupVideoEvents(video)
        
        // Set the stream to video element
        video.srcObject = mediaStream
        
        console.log("🎥 Video srcObject set, attempting to play...")
        setDebugInfo("Mencoba memutar video...")
        
        // Try to play the video with a small delay
        setTimeout(async () => {
          try {
            await video.play()
            console.log("🎥 Video play successful")
          } catch (playError) {
            console.error("🎥 Video play error:", playError)
            // Video might still work even if autoplay fails
            console.log("🎥 Continuing despite play error...")
            setVideoReady(true)
            setIsLoading(false)
          }
        }, 100)
        
        // Fallback timeout to ensure we don't stay loading forever
        setTimeout(() => {
          if (isLoading && !videoReady) {
            console.log("🎥 Fallback timeout - forcing video ready state")
            setVideoReady(true)
            setIsLoading(false)
            setDebugInfo("Video siap (fallback)")
          }
        }, 3000)
        
      } catch (videoError: unknown) {
         console.error("🎥 Video element error:", videoError)
         setDebugInfo(`Error: ${videoError instanceof Error ? videoError.message : 'Unknown error'}`)
         setIsLoading(false)
         toast.error("Video element tidak dapat diakses")
       }
      
    } catch (error: unknown) {
      console.error("🎥 Error accessing camera:", error)
      setIsLoading(false)
      
      let errorMessage = "Tidak dapat mengakses kamera."
      
      if (error && typeof error === 'object' && 'name' in error) {
        const errorName = (error as { name: string }).name;
        if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
          errorMessage = "Akses kamera ditolak. Silakan izinkan akses kamera di browser."
        } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
          errorMessage = "Kamera tidak ditemukan. Pastikan kamera terhubung."
        } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
          errorMessage = "Kamera sedang digunakan aplikasi lain."
        } else if (errorName === "OverconstrainedError" || errorName === "ConstraintNotSatisfiedError") {
          errorMessage = "Kamera tidak mendukung pengaturan yang diminta."
        }
      }
      
      if (error instanceof Error && error.message) {
        errorMessage = error.message
      }
      
      setDebugInfo(`Error: ${errorMessage}`)
      toast.error(errorMessage)
    }
  }, [waitForVideoElement, setupVideoEvents, isLoading, videoReady])

  const stopCamera = useCallback(() => {
    console.log("🎥 Stopping camera...")
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log("🎥 Stopping track:", track.kind, track.label)
        track.stop()
      })
      setStream(null)
    }
    setIsActive(false)
    setCapturedImage(null)
    setVideoReady(false)
    setIsLoading(false)
    setDebugInfo("")
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !videoReady) {
      toast.error("Video belum siap untuk diambil foto")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) {
      toast.error("Tidak dapat mengakses canvas context")
      return
    }

    // Set canvas dimensions to square (1:1 aspect ratio)
    const size = Math.min(video.videoWidth || video.clientWidth, video.videoHeight || video.clientHeight)
    canvas.width = size
    canvas.height = size

    // Calculate crop position to center the square
    const videoWidth = video.videoWidth || video.clientWidth
    const videoHeight = video.videoHeight || video.clientHeight
    const cropX = (videoWidth - size) / 2
    const cropY = (videoHeight - size) / 2

    // Draw the cropped square video frame to canvas
    context.drawImage(video, cropX, cropY, size, size, 0, 0, size, size)

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
      } else {
        toast.error("Gagal mengambil foto")
      }
    }, "image/jpeg", 0.8)
  }, [stopCamera, onCapture, videoReady])

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
                className="w-full aspect-square object-cover rounded-lg"
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
                className="w-full aspect-square object-cover rounded-lg bg-gray-100"
                style={{ 
                  transform: "scaleX(-1)", // Mirror the video for selfie
                  display: videoReady ? "block" : "none"
                }}
              />
              {(isLoading || !videoReady) && (
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {isLoading ? "Memuat kamera..." : "Menunggu kamera siap..."}
                    </p>
                    {debugInfo && (
                      <p className="text-xs text-gray-400 max-w-48 mx-auto">
                        Debug: {debugInfo}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                onClick={capturePhoto}
                disabled={!videoReady}
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
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {isLoading ? "Memuat..." : "Aktifkan Kamera"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}