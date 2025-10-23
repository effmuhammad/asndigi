"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CameraCapture } from "@/components/ui/camera-capture"
import { MapPin, Clock, Camera, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

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

export default function AbsensiPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [attendancePhoto, setAttendancePhoto] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        console.error("Error getting location:", error)
        setLocationError("Gagal mendapatkan lokasi. Pastikan GPS aktif.")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
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
        if (data.attendance && data.attendance.length > 0) {
          setTodayAttendance(data.attendance[0])
        }
      }
    } catch (error) {
      console.error("Error loading today's attendance:", error)
    }
  }

  const loadAttendanceHistory = async () => {
    try {
      const response = await fetch("/api/attendance?limit=10")
      
      if (response.ok) {
        const data = await response.json()
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
      }
    } catch (error) {
      console.error("Error loading attendance history:", error)
    }
  }

  const handlePhotoCapture = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "photo")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error("Failed to upload photo")
      }

      const uploadedFile = await response.json()
      setAttendancePhoto(file)
      setShowCamera(false)
      toast.success("Foto berhasil diambil")
      
      // Store the uploaded file URL for submission
      setAttendancePhoto(Object.assign(file, { url: uploadedFile.url }))
    } catch (error) {
      console.error("Photo upload error:", error)
      toast.error("Gagal mengupload foto")
    }
  }

  const handleCheckIn = async () => {
    if (!location) {
      toast.error("Lokasi belum terdeteksi")
      return
    }

    if (!attendancePhoto) {
      toast.error("Foto selfie diperlukan untuk absensi")
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
          photo_url: (attendancePhoto as any).url
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to check in")
      }

      const result = await response.json()
      setTodayAttendance(result.attendance)
      setAttendancePhoto(null)
      toast.success("Berhasil check in!")
      loadAttendanceHistory() // Refresh history
    } catch (error: any) {
      console.error("Check in error:", error)
      toast.error(error.message || "Gagal melakukan check in")
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

      const result = await response.json()
      setTodayAttendance(result.attendance)
      toast.success("Berhasil check out!")
      loadAttendanceHistory() // Refresh history
    } catch (error: any) {
      console.error("Check out error:", error)
      toast.error(error.message || "Gagal melakukan check out")
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
          <h1 className="text-3xl font-bold">Absensi</h1>
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
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Belum melakukan absensi hari ini
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

      {/* Camera Section */}
      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Absensi</CardTitle>
          <CardDescription>
            Pastikan lokasi terdeteksi dan foto selfie telah diambil sebelum melakukan absensi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!attendancePhoto && !todayAttendance?.check_in_time && (
            <Button
              onClick={() => setShowCamera(true)}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Ambil Foto Selfie
            </Button>
          )}

          {attendancePhoto && (
            <div className="p-3 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Foto selfie siap</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!todayAttendance?.check_in_time ? (
              <Button
                onClick={handleCheckIn}
                disabled={!location || !attendancePhoto || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Memproses..." : "Check In"}
              </Button>
            ) : !todayAttendance?.check_out_time ? (
              <Button
                onClick={handleCheckOut}
                disabled={!location || isSubmitting}
                variant="outline"
                className="flex-1"
              >
                {isSubmitting ? "Memproses..." : "Check Out"}
              </Button>
            ) : (
              <div className="flex-1 text-center text-muted-foreground">
                Absensi hari ini sudah selesai
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Absensi</CardTitle>
          <CardDescription>10 data absensi terakhir</CardDescription>
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
                Belum ada riwayat absensi
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}