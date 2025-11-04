"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CameraCapture } from "@/components/ui/camera-capture"
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle, Brain, Loader2 } from "lucide-react"
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

interface AttendanceSummaryResponse {
  executive_summary: string
  attendance_analysis: {
    total_days: number
    present_days: number
    late_days: number
    absent_days: number
    attendance_rate: number
    punctuality_rate: number
  }
  patterns_insights: string[]
  recommendations: string[]
  performance_score: number
}

interface AiSummaryData {
  user: {
    name: string
    nip: string
  }
  period: string
  summary: AttendanceSummaryResponse
}

interface TukinCalculation {
  month: number
  year: number
  period: string
  totalLateMinutes: number
  totalAbsentDays: number
  violationType: 'ringan' | 'sedang' | 'berat' | 'tidak ada'
  tukinScore: number
  breakdown: {
    lateAddition: number
    absentAddition: number
    disciplineAddition: number
    totalAddition: number
  }
}

export default function PresensiPage() {
  const { data: session } = useSession()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [attendancePhoto, setAttendancePhoto] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [supabasePhotoUrl, setSupabasePhotoUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [workSettings, setWorkSettings] = useState<{
    work_start_time: string
    work_end_time: string
    late_tolerance_minutes: number
  } | null>(null)

  // Helper function to format time from database without timezone conversion
  const formatTimeFromDatabase = (timeString: string): string => {
    // Parse the datetime string and extract just the time part
    const date = new Date(timeString)
    // Use UTC methods to avoid timezone conversion
    const hours = date.getUTCHours().toString().padStart(2, '0')
    const minutes = date.getUTCMinutes().toString().padStart(2, '0')
    const seconds = date.getUTCSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  // AI Summary states
  const [aiSummary, setAiSummary] = useState<AiSummaryData | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [showAiSummary, setShowAiSummary] = useState(false)

  // Tukin Calculation states
  const [tukinCalculation, setTukinCalculation] = useState<TukinCalculation | null>(null)
  const [isLoadingTukin, setIsLoadingTukin] = useState(false)
  const [selectedTukinMonth, setSelectedTukinMonth] = useState(() => {
    return `2025-10`
  })

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Get current location on component mount with retry mechanism
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 3
    let isComponentMounted = true
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    // Early check for geolocation support
    if (!navigator.geolocation) {
      setLocationError("Geolocation tidak didukung oleh browser ini. Silakan gunakan browser yang mendukung GPS.")
      return
    }

    // Development fallback location (Jakarta coordinates)
    const isDevelopment = process.env.NODE_ENV === 'development'
    const fallbackLocation = { lat: -6.2088, lng: 106.8456 }

    const getLocationWithRetry = (attempt = 0) => {
      if (!isComponentMounted) return

      // Clear any existing debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      // Debounce mechanism to prevent rapid successive calls
      debounceTimer = setTimeout(() => {
        if (!navigator.geolocation) {
          setLocationError("Geolocation tidak didukung oleh browser ini")
          return
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isComponentMounted) return
            
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
            setLocationError(null)
            retryCount = 0 // Reset retry count on success
          },
          (error) => {
            if (!isComponentMounted) return

            let errorMessage = "Gagal mendapatkan lokasi."
            let shouldRetry = false
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "Akses lokasi ditolak. Silakan izinkan akses lokasi di browser."
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage = "GPS tidak tersedia. Pastikan GPS aktif dan coba lagi."
                shouldRetry = true
                break
              case error.TIMEOUT:
                errorMessage = "Waktu habis saat mendapatkan lokasi. Mencoba lagi..."
                shouldRetry = true
                break
              default:
                errorMessage = "Terjadi kesalahan saat mendapatkan lokasi."
                shouldRetry = true
            }

            // Only log once per error type to reduce spam
            if (attempt === 0) {
              console.warn(`Geolocation error (code ${error.code}): ${error.message}`)
            }

            // Retry mechanism with exponential backoff
            if (shouldRetry && attempt < maxRetries) {
              const backoffDelay = Math.pow(2, attempt) * 2000 // 2s, 4s, 8s
              setTimeout(() => {
                if (isComponentMounted) {
                  getLocationWithRetry(attempt + 1)
                }
              }, backoffDelay)
              
              if (attempt === 0) {
                setLocationError(`${errorMessage} (Mencoba lagi dalam ${backoffDelay/1000} detik...)`)
              }
            } else {
              // All retries failed or non-retryable error
              if (isDevelopment && shouldRetry) {
                // Use fallback location in development
                setLocation(fallbackLocation)
                setLocationError("Menggunakan lokasi default untuk development")
              } else {
                setLocationError(errorMessage)
              }
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // Reduced timeout to 10 seconds
            maximumAge: 300000 // 5 minutes cache
          }
        )
      }, attempt === 0 ? 0 : 500) // No delay for first attempt, 500ms for retries
    }

    // Check permissions first
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted' || result.state === 'prompt') {
          getLocationWithRetry()
        } else {
          if (isDevelopment) {
            setLocation(fallbackLocation)
            setLocationError("Menggunakan lokasi default untuk development")
          } else {
            setLocationError("Akses lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser.")
          }
        }
      }).catch(() => {
        // Fallback if permissions API is not supported
        getLocationWithRetry()
      })
    } else {
      // Fallback if permissions API is not supported
      getLocationWithRetry()
    }

    // Cleanup function
    return () => {
      isComponentMounted = false
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [])

  // Load today's attendance and history
  useEffect(() => {
    loadTodayAttendance()
    loadAttendanceHistory()
    loadWorkSettings()
    loadTukinCalculation()
  }, [])

  // Load tukin calculation when month changes
  useEffect(() => {
    loadTukinCalculation()
  }, [selectedTukinMonth])

  const loadWorkSettings = async () => {
    try {
      const response = await fetch('/api/admin/work-settings')
      if (response.ok) {
        const data = await response.json()
        setWorkSettings(data)
      }
    } catch (error) {
      console.error('Error loading work settings:', error)
    }
  }

  const loadTukinCalculation = async () => {
    if (!session?.user) return
    
    setIsLoadingTukin(true)
    try {
      // Validate selectedTukinMonth format
      if (!selectedTukinMonth || !selectedTukinMonth.includes('-')) {
        console.error('Invalid selectedTukinMonth format:', selectedTukinMonth)
        setTukinCalculation(null)
        return
      }
      
      const [year, month] = selectedTukinMonth.split('-')
      
      // Validate year and month
      if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
        console.error('Invalid year or month:', { year, month })
        setTukinCalculation(null)
        return
      }
      
      const response = await fetch(`/api/attendance/tukin-calculation?month=${month}&year=${year}`)
      
      if (response.ok) {
        const data = await response.json()
        setTukinCalculation(data.data)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to load tukin calculation:', response.status, errorData)
        setTukinCalculation(null)
      }
    } catch (error) {
      console.error('Error loading tukin calculation:', error)
      setTukinCalculation(null)
    } finally {
      setIsLoadingTukin(false)
    }
  }

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
            date: new Date(record.attendance_date).toLocaleDateString("id-ID"),
            checkIn: record.check_in ? formatTimeFromDatabase(record.check_in) : null,
            checkOut: record.check_out ? formatTimeFromDatabase(record.check_out) : null,
            status: record.status === "PRESENT" ? "hadir" : record.status === "LATE" ? "terlambat" : "alpha",
            location: {
              latitude: record.location_data?.latitude,
              longitude: record.location_data?.longitude,
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

  // AI Summary generation function
  const generateAiSummary = async () => {
    if (!session?.user) {
      toast.error("Anda harus login untuk menggunakan fitur ini")
      return
    }

    setIsGeneratingSummary(true)
    try {
      const [year, month] = selectedTukinMonth.split('-')
      
      const response = await fetch('/api/attendance/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: month,
          year: year,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal menghasilkan ringkasan AI')
      }

      const data = await response.json()
      setAiSummary(data.data) // Extract the data property from the response
      setShowAiSummary(true)
      toast.success("Ringkasan AI berhasil dihasilkan!")
    } catch (error) {
      console.error('Error generating AI summary:', error)
      toast.error(error instanceof Error ? error.message : "Gagal menghasilkan ringkasan AI")
    } finally {
      setIsGeneratingSummary(false)
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
          action: "check-in",
          location_data: {
            latitude: location.lat,
            longitude: location.lng
          },
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
          action: "check-out",
          location_data: {
            latitude: location.lat,
            longitude: location.lng
          }
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
    <div className="w-full max-w-none space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Presensi</h1>
          <p className="text-muted-foreground">Kelola kehadiran harian Anda</p>
        </div>
        
        <div className="flex items-center space-x-2">
          

        </div>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Status Presensi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time and Date Section */}
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

          {/* Work Time Display */}
          {workSettings && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Jam Kerja</h4>
              <div className="flex justify-between text-sm text-blue-700">
                <span>Masuk: {workSettings.work_start_time}</span>
                <span>Pulang: {workSettings.work_end_time}</span>
              </div>
            </div>
          )}



          <Separator />

          {/* Attendance Status Section */}
          {todayAttendance ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Presensi Masuk:</span>
                <Badge variant="secondary">
                  {todayAttendance.checkIn ? formatTimeFromDatabase(todayAttendance.checkIn) : "-"}
                </Badge>
              </div>
              {todayAttendance.checkOut && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Presensi Keluar:</span>
                  <Badge variant="secondary">
                    {formatTimeFromDatabase(todayAttendance.checkOut)}
                  </Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm">Status:</span>
                <Badge variant={todayAttendance.status === "PRESENT" ? "default" : "destructive"}>
                  {todayAttendance.status === "PRESENT" ? "Hadir" : 
                   todayAttendance.status === "LATE" ? "Terlambat" : "Tidak Hadir"}
                </Badge>
              </div>
              
              {/* Show current attendance status */}
              {todayAttendance.checkIn && !todayAttendance.checkOut && (
                <div className="text-center p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Sudah presensi masuk hari ini
                  </p>
                  <p className="text-xs text-green-600">
                    Jangan lupa presensi keluar
                  </p>
                </div>
              )}
              
              {todayAttendance.checkIn && todayAttendance.checkOut && (
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

          <Separator />

          {/* Location Status Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="w-4 h-4" />
              Status Lokasi
            </div>
            {locationError ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Lokasi tidak dapat diakses</span>
                </div>
                <div className="text-xs text-muted-foreground bg-red-50 border border-red-200 rounded-lg p-2">
                  {locationError}
                </div>
                <div className="text-xs text-blue-600">
                  💡 Tips: Pastikan GPS aktif dan izinkan akses lokasi di browser
                </div>
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
          </div>
        </CardContent>
      </Card>

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
                {!todayAttendance?.checkIn ? (
                  <Button
                    onClick={handleCheckIn}
                    disabled={!location || !supabasePhotoUrl || isSubmitting || isUploadingPhoto}
                    className="w-full"
                  >
                    {isSubmitting ? "Memproses..." : isUploadingPhoto ? "Mengupload foto..." : "Presensi Masuk"}
                  </Button>
                ) : !todayAttendance?.checkOut ? (
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

      {/* Tukin Calculation Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Perhitungan Tukin Presensi
          </CardTitle>
          <CardDescription>
            Perhitungan potongan Tukin berdasarkan keterlambatan, ketidakhadiran, dan pelanggaran disiplin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="tukin-month" className="text-sm font-medium">
              Pilih Bulan:
            </label>
            <select
              id="tukin-month"
              value={selectedTukinMonth}
              onChange={(e) => setSelectedTukinMonth(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                const currentYear = new Date().getFullYear();
                const date = new Date(currentYear, i, 1);
                const value = `${currentYear}-${month.toString().padStart(2, '0')}`;
                return (
                  <option key={month} value={value}>
                    {date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </option>
                );
              })}
            </select>
            
          </div>

          {/* Loading State */}
          {isLoadingTukin && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Memuat data perhitungan...</span>
            </div>
          )}

          {/* Calculation Results */}
          {!isLoadingTukin && tukinCalculation && (
            <div className="space-y-4">
              {/* Calculation Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Komponen
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Nilai
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Penambahan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        Total Waktu Terlambat
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {tukinCalculation.totalLateMinutes} menit
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        +{tukinCalculation.breakdown.lateAddition}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        Total Hari Tidak Hadir
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {tukinCalculation.totalAbsentDays} hari
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        +{tukinCalculation.breakdown.absentAddition}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        Jenis Pelanggaran Disiplin
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <Badge variant={
                          tukinCalculation.violationType === 'tidak ada' ? 'default' :
                          tukinCalculation.violationType === 'ringan' ? 'secondary' :
                          tukinCalculation.violationType === 'sedang' ? 'destructive' :
                          'destructive'
                        }>
                          {tukinCalculation.violationType.charAt(0).toUpperCase() + tukinCalculation.violationType.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        +{tukinCalculation.breakdown.disciplineAddition}%
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        Total Penambahan Tukin
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        -
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">
                        +{tukinCalculation.breakdown.totalAddition}%
                      </td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-4 py-3 text-sm font-medium text-green-800">
                        Total Skor Tukin Presensi
                      </td>
                      <td className="px-4 py-3 text-sm text-green-700">
                        -
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-700">
                        {tukinCalculation.tukinScore}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Calculation Rules */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Ketentuan Perhitungan</h4>
                <div className="text-sm text-yellow-700 space-y-2">
                  <div>
                    <p><strong>Terlambat Masuk (Bulanan):</strong></p>
                    <p className="ml-4">• 0 menit = 10%</p>
                    <p className="ml-4">• 0-25 menit = 7.5%</p>
                    <p className="ml-4">• 25-50 menit = 5%</p>
                    <p className="ml-4">• 50-75 menit = 2.5%</p>
                    <p className="ml-4">• &gt;75 menit = 0%</p>
                  </div>
                  <div>
                    <p><strong>Tidak Hadir (Bulanan):</strong></p>
                    <p className="ml-4">• 0 hari = 15%</p>
                    <p className="ml-4">• 1 hari atau lebih = 0%</p>
                  </div>
                  <div>
                    <p><strong>Pelanggaran Disiplin:</strong></p>
                    <p className="ml-4">• Tidak ada hukuman = 15%</p>
                    <p className="ml-4">• Hukuman ringan = 0% (1 bulan)</p>
                    <p className="ml-4">• Hukuman sedang = 0% (2 bulan)</p>
                    <p className="ml-4">• Hukuman berat = 0% (3 bulan)</p>
                  </div>
                  <p><strong>Total Persentase Tukin Presensi:</strong> Maksimal 40% (10% + 15% + 15%)</p>
                </div>
              </div>

              {/* Modern AI Analysis Button with Description - Only show when AI summary is not generated */}
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <Button
                    onClick={generateAiSummary}
                    disabled={isGeneratingSummary}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isGeneratingSummary ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Menganalisis...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5" />
                        Analisis AI Presensi
                      </>
                    )}
                  </Button>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Analisis Cerdas</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Analisis cerdas pola presensi dan rekomendasi untuk meningkatkan produktifitas kerja
                    </p>
                  </div>
                </div>

              {/* AI Summary for Tukin Analysis - Only show when generated */}
              {showAiSummary && aiSummary && (
                <div className="border-t pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">Analisis AI Presensi</h3>
                    </div>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
                      <h4 className="font-semibold text-gray-900">
                        Ringkasan Presensi - {aiSummary.user.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        NIP: {aiSummary.user.nip} • Periode: {aiSummary.period}
                      </p>
                    </div>

                    {/* Executive Summary */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Ringkasan Eksekutif</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {aiSummary.summary.executive_summary}
                      </p>
                    </div>

                    {/* Attendance Analysis */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Analisis Kehadiran</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-700">
                            {aiSummary.summary.attendance_analysis.present_days}
                          </div>
                          <div className="text-xs text-green-600">Hari Hadir</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <div className="text-2xl font-bold text-yellow-700">
                            {aiSummary.summary.attendance_analysis.late_days}
                          </div>
                          <div className="text-xs text-yellow-600">Hari Terlambat</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <div className="text-2xl font-bold text-red-700">
                            {aiSummary.summary.attendance_analysis.absent_days}
                          </div>
                          <div className="text-xs text-red-600">Hari Tidak Hadir</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="text-2xl font-bold text-blue-700">
                            {aiSummary.summary.attendance_analysis.attendance_rate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-blue-600">Tingkat Kehadiran</div>
                        </div>
                      </div>
                    </div>

                    {/* Patterns & Insights */}
                    {aiSummary.summary.patterns_insights.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">Pola & Wawasan</h4>
                        <ul className="space-y-1">
                          {aiSummary.summary.patterns_insights.map((insight, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-blue-500">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {aiSummary.summary.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">Rekomendasi untuk Perbaikan Tukin</h4>
                        <ul className="space-y-1">
                          {aiSummary.summary.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-green-500">✓</span>
                              <span>{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Data State */}
          {!isLoadingTukin && !tukinCalculation && (
            <div className="text-center text-muted-foreground py-8">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Tidak ada data perhitungan untuk periode yang dipilih</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Presensi</CardTitle>
          <CardDescription>10 data presensi terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceHistory.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Jam Masuk
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Jam Keluar
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Lokasi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendanceHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {record.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.checkIn || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.checkOut || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.location?.address ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]" title={record.location.address}>
                              {record.location.address}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Belum ada riwayat presensi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}