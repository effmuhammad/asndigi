'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Clock, Save, RefreshCw } from 'lucide-react'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface WorkSettings {
  id: string
  work_start_time: string
  work_end_time: string
  late_tolerance_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [workSettings, setWorkSettings] = useState<WorkSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    work_start_time: '',
    work_end_time: '',
    late_tolerance_minutes: 0
  })

  // Fetch work settings
  const fetchWorkSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/work-settings')
      if (!response.ok) {
        throw new Error('Failed to fetch work settings')
      }
      const data = await response.json()
      setWorkSettings(data)
      setFormData({
        work_start_time: data.work_start_time,
        work_end_time: data.work_end_time,
        late_tolerance_minutes: data.late_tolerance_minutes
      })
    } catch (error) {
      console.error('Error fetching work settings:', error)
      toast.error('Gagal memuat pengaturan waktu kerja')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchWorkSettings()
    } else if (status !== 'loading') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/work-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update work settings')
      }

      toast.success('Pengaturan waktu kerja berhasil diperbarui')
      fetchWorkSettings()
    } catch (error: any) {
      console.error('Error updating work settings:', error)
      toast.error(error.message || 'Gagal memperbarui pengaturan waktu kerja')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'late_tolerance_minutes' ? parseInt(value) || 0 : value
    }))
  }

  // Reset to default
  const handleReset = () => {
    setFormData({
      work_start_time: '08:00',
      work_end_time: '17:00',
      late_tolerance_minutes: 15
    })
    toast.info('Pengaturan direset ke default. Klik Simpan untuk menerapkan.')
  }

  // Loading state
  if (status === 'loading' || (session?.user.role !== 'ADMIN' && status !== 'loading')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h1>
        <p className="text-muted-foreground">
          Konfigurasi pengaturan sistem PRIMA ASN
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Konfigurasi Waktu Kerja
                </CardTitle>
                <CardDescription>
                  Atur jam kerja dan toleransi keterlambatan
                </CardDescription>
              </div>
              {workSettings && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Terakhir diperbarui: {new Date(workSettings.updated_at).toLocaleDateString('id-ID')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="work_start_time">Jam Masuk Kerja</Label>
                    <Input
                      id="work_start_time"
                      name="work_start_time"
                      type="time"
                      value={formData.work_start_time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work_end_time">Jam Pulang Kerja</Label>
                    <Input
                      id="work_end_time"
                      name="work_end_time"
                      type="time"
                      value={formData.work_end_time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="late_tolerance_minutes">Toleransi Keterlambatan (menit)</Label>
                  <Input
                    id="late_tolerance_minutes"
                    name="late_tolerance_minutes"
                    type="number"
                    min="0"
                    max="60"
                    value={formData.late_tolerance_minutes}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    Pegawai dianggap terlambat jika check-in melebihi jam masuk + toleransi
                  </p>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={loading || submitting}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset ke Default
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Pengaturan
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}