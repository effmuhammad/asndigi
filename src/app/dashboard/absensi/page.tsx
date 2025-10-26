"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CameraCapture } from "@/components/ui/camera-capture"
import { MapPin, Clock, Camera, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { uploadPhotoToSupabase } from "@/lib/supabase"

interface AttendanceRecord {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
}

export default function PresensiPage() {
  const { data: session } = useSession()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [attendancePhoto, setAttendancePhoto] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [supabasePhotoUrl, setSupabasePhotoUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Get current location on component mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation tidak didukung oleh browser ini")
      return
    }

    const getLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setLocationError(null) // Clear any previous errors
        },
        (error) => {
          console.error("Error getting location:", {
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString()
          })
          
          let errorMessage = "Gagal mendapatkan lokasi."
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Akses lokasi ditolak. Silakan izinkan akses lokasi di browser."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Informasi lokasi tidak tersedia. Pastikan GPS aktif."
              break
            case error.TIMEOUT:
              errorMessage = "Waktu habis saat mendapatkan lokasi. Coba lagi."
              break
            default:
              errorMessage = "Terjadi kesalahan saat mendapatkan lokasi."
          }
          
          setLocationError(errorMessage)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 300000 // 5 minutes cache
        }
      )
    }

    // Check permissions first
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          getLocation()
        } else if (result.state === 'prompt') {
          getLocation()
        } else {
          setLocationError("Akses lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser.")
        }
      }).catch(() => {
        // Fallback if permissions API is not supported
        getLocation()
      })
    } else {
      // Fallback if permissions API is not supported
      getLocation()
    }
  }, [])

  // Load today's attendance and history
  useEffect(() => {
    loadTodayAttendance()
    loadAttendanceHistory()
  }, [])

  const loadTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/attendance?date=${today}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Check if data and data.attendance exist and is an array
        if (data && data.attendance && Array.isArray(data.attendance) && data.attendance.length > 0) {
          setTodayAttendance(data.attendance[0])
        } else {
          setTodayAttendance(null) // No attendance data for today
        }
      } else {
        console.error("Failed to fetch today's attendance:", response.status, response.statusText)
        setTodayAttendance(null)
      }
    } catch (error) {
      console.error("Error loading today's attendance:", error)
      setTodayAttendance(null)
    }
  }

  const loadAttendanceHistory = async () => {
    try {
      const response = await fetch("/api/attendance?limit=10")
      
      if (response.ok) {
        const data = await response.json()
        
        // Check if data and data.attendance exist and is an array
        if (data && data.attendance && Array.isArray(data.attendance)) {
          const formattedHistory = data.attendance.map((record: any) => ({
            id: record.id,
            date: new Date(record.date).toLocaleDateString("id-ID"),
            checkIn: record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString("id-ID") : null,
            checkOut: record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString("id-ID") : null,
            status: record.status === "present" ? "hadir" : record.status === "late" ? "terlambat" : "alpha",
            location: {
              latitude: record.latitude,
              longitude: record.longitude,
              address: "Kantor Pusat"
            }
          }))
          setAttendanceHistory(formattedHistory)
        } else {
          console.warn("Invalid attendance data structure:", data)
          setAttendanceHistory([]) // Set empty array as fallback
        }
      } else {
        console.error("Failed to fetch attendance history:", response.status, response.statusText)
        setAttendanceHistory([]) // Set empty array on API error
      }
    } catch (error) {
      console.error("Error loading attendance history:", error)
      setAttendanceHistory([]) // Set empty array on network error
    }
  }

  const handlePhotoCapture = async (file: File) => {
    if (!session?.user?.id) {
      toast.error("Session tidak valid")
      return
    }

    setIsUploadingPhoto(true)
    try {
      // Upload photo to Supabase storage
      const supabaseUrl = await uploadPhotoToSupabase(file, session.user.id)
      
      setAttendancePhoto(file)
      setSupabasePhotoUrl(supabaseUrl)
      
      // Create preview URL for the captured photo
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreviewUrl(previewUrl)
      
      setShowCamera(false)
      toast.success("Foto berhasil diambil dan disimpan")
    } catch (error) {
      console.error("Photo upload error:", error)
      toast.error("Gagal mengupload foto ke storage")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleCheckIn = async () => {
    if (!location) {
      toast.error("Lokasi belum terdeteksi")
      return
    }

    if (!supabasePhotoUrl) {
      toast.error("Foto selfie diperlukan untuk presensi")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "check_in",
          latitude: location.lat,
          longitude: location.lng,
          photo_url: supabasePhotoUrl
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to check in")
      }

      await loadTodayAttendance()
      toast.success("Berhasil presensi masuk!")
      
      // Reset photo states after successful check-in
      setAttendancePhoto(null)
      setPhotoPreviewUrl(null)
      setSupabasePhotoUrl(null)
    } catch (error: any) {
      console.error("Check in error:", error)
      
      // Handle specific "Already checked in today" error
      if (error.message && error.message.includes("Already checked in today")) {
        toast.error("Anda sudah melakukan presensi masuk hari ini")
        // Reload attendance data to sync UI state
        await loadTodayAttendance()
        // Don't reset photo states for this validation error
      } else {
        toast.error(error.message || "Gagal melakukan presensi masuk")
        // Reset photo states only for actual errors, not validation errors
        setAttendancePhoto(null)
        setPhotoPreviewUrl(null)
        setSupabasePhotoUrl(null)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckOut = async () => {
    if (!location) {
      toast.error("Lokasi belum terdeteksi")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "check_out",
          latitude: location.lat,
          longitude: location.lng
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to check out")
      }

      await loadTodayAttendance()
      toast.success("Berhasil presensi keluar!")
    } catch (error: any) {
      console.error("Check out error:", error)
      toast.error(error.message || "Gagal melakukan presensi keluar")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hadir':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Hadir</Badge>
      case 'terlambat':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Terlambat</Badge>
      case 'alpha':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Alpha</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="w-full max-w-none p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Presensi</h1>
          <p className="text-muted-foreground">Kelola kehadiran harian Anda</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Status Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {currentTime.toLocaleTimeString("id-ID")}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </div>
            </div>

            <Separator />

            {todayAttendance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Check In:</span>
                  <Badge variant="secondary">
                    {new Date(todayAttendance.check_in_time).toLocaleTimeString("id-ID")}
                  </Badge>
                </div>
                {todayAttendance.check_out_time && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Check Out:</span>
                    <Badge variant="secondary">
                      {new Date(todayAttendance.check_out_time).toLocaleTimeString("id-ID")}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge variant={todayAttendance.status === "present" ? "default" : "destructive"}>
                    {todayAttendance.status === "present" ? "Hadir" : 
                     todayAttendance.status === "late" ? "Terlambat" : "Tidak Hadir"}
                  </Badge>
                </div>
                
                {/* Show current attendance status */}
                {todayAttendance.check_in_time && !todayAttendance.check_out_time && (
                  <div className="text-center p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">
                      ✓ Sudah presensi masuk hari ini
                    </p>
                    <p className="text-xs text-green-600">
                      Jangan lupa presensi keluar
                    </p>
                  </div>
                )}
                
                {todayAttendance.check_in_time && todayAttendance.check_out_time && (
                  <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">
                      ✓ Presensi hari ini sudah lengkap
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Belum melakukan presensi hari ini
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Status Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationError ? (
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">{locationError}</span>
              </div>
            ) : location ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Lokasi terdeteksi</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Mendeteksi lokasi...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aksi Presensi - Camera & Action Buttons Combined */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Presensi</CardTitle>
          <CardDescription>
            Pastikan lokasi terdeteksi dan foto selfie telah diambil sebelum melakukan presensi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Desktop: 2 Column Layout, Mobile: Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Camera Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Kamera Selfie</h4>
              <CameraCapture
                onCapture={handlePhotoCapture}
                onCancel={() => setShowCamera(false)}
              />
            </div>

            {/* Right Column: Action Buttons */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Aksi</h4>
              
              {/* Photo Preview */}
              {photoPreviewUrl && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Preview Foto</h4>
                  <div className="flex justify-center">
                    <img
                      src={photoPreviewUrl}
                      alt="Preview foto selfie"
                      className="aspect-square w-32 h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                    />
                  </div>
                </div>
              )}



              {/* Check In/Out Buttons */}
              <div className="space-y-2">
                {!todayAttendance?.check_in_time ? (
                  <Button
                    onClick={handleCheckIn}
                    disabled={!location || !supabasePhotoUrl || isSubmitting || isUploadingPhoto}
                    className="w-full"
                  >
                    {isSubmitting ? "Memproses..." : isUploadingPhoto ? "Mengupload foto..." : "Presensi Masuk"}
                  </Button>
                ) : !todayAttendance?.check_out_time ? (
                  <Button
                    onClick={handleCheckOut}
                    disabled={!location || isSubmitting}
                    variant="outline"
                    className="w-full"
                  >
                    {isSubmitting ? "Memproses..." : "Presensi Keluar"}
                  </Button>
                ) : (
                  <div className="w-full text-center text-muted-foreground p-3 border rounded-lg bg-gray-50">
                    Presensi hari ini sudah selesai
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Presensi</CardTitle>
          <CardDescription>10 data presensi terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceHistory.length > 0 ? (
              attendanceHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{record.date}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.checkIn && `Masuk: ${record.checkIn}`}
                      {record.checkIn && record.checkOut && " • "}
                      {record.checkOut && `Keluar: ${record.checkOut}`}
                    </div>
                    {record.location && (
                      <div className="text-xs text-muted-foreground">
                        📍 {record.location.address}
                      </div>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Belum ada riwayat presensi
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}