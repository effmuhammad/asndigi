"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/ui/file-upload"
import { GraduationCap, Plus, Edit, Trash2, Download, Calendar, Award, Building } from "lucide-react"
import { trainingRecordSchema, type TrainingRecordFormData, TRAINING_CATEGORY_OPTIONS } from "@/lib/validations/profile"

interface TrainingTabProps {
  profileData: any
  onUpdate: (data: any) => void
}

interface TrainingRecord {
  id: string
  training_name: string
  category: string
  organizer: string
  start_date: string
  end_date: string
  duration_hours: number
  location: string
  description?: string
  certificate_url?: string
  created_at: string
}

export function TrainingTab({ profileData, onUpdate }: TrainingTabProps) {
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)

  const form = useForm<TrainingRecordFormData>({
    resolver: zodResolver(trainingRecordSchema),
    defaultValues: {
      training_name: "",
      category: "",
      organizer: "",
      start_date: "",
      end_date: "",
      duration_hours: 0,
      location: "",
      description: "",
    }
  })

  useEffect(() => {
    if (profileData?.training_records) {
      setTrainingRecords(profileData.training_records)
    } else {
      fetchTrainingRecords()
    }
  }, [profileData])

  const fetchTrainingRecords = async () => {
    try {
      const response = await fetch('/api/profile/training')
      if (response.ok) {
        const data = await response.json()
        setTrainingRecords(data)
      }
    } catch (error) {
      console.error('Error fetching training records:', error)
    }
  }

  const handleCertificateUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'certificate')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        return result.url
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading certificate:', error)
      toast.error('Gagal mengupload sertifikat')
      return null
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    setCertificateFile(null)
    form.reset({
      training_name: "",
      category: "",
      organizer: "",
      start_date: "",
      end_date: "",
      duration_hours: 0,
      location: "",
      description: "",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (record: TrainingRecord) => {
    setEditingRecord(record)
    setCertificateFile(null)
    form.reset({
      training_name: record.training_name,
      category: record.category,
      organizer: record.organizer,
      start_date: record.start_date,
      end_date: record.end_date,
      duration_hours: record.duration_hours,
      location: record.location,
      description: record.description || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pelatihan ini?')) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/profile/training/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const updatedRecords = trainingRecords.filter(record => record.id !== id)
        setTrainingRecords(updatedRecords)
        onUpdate({ training_records: updatedRecords })
        toast.success('Data pelatihan berhasil dihapus')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Gagal menghapus data pelatihan')
      }
    } catch (error) {
      console.error('Error deleting training record:', error)
      toast.error('Terjadi kesalahan saat menghapus data pelatihan')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: TrainingRecordFormData) => {
    try {
      setIsLoading(true)

      let certificateUrl = editingRecord?.certificate_url
      if (certificateFile) {
        certificateUrl = await handleCertificateUpload(certificateFile)
        if (!certificateUrl) return
      }

      const submitData = {
        ...data,
        certificate_url: certificateUrl,
      }

      const url = editingRecord 
        ? `/api/profile/training/${editingRecord.id}`
        : '/api/profile/training'
      
      const method = editingRecord ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (editingRecord) {
          const updatedRecords = trainingRecords.map(record => 
            record.id === editingRecord.id ? result : record
          )
          setTrainingRecords(updatedRecords)
          onUpdate({ training_records: updatedRecords })
          toast.success('Data pelatihan berhasil diperbarui')
        } else {
          const updatedRecords = [...trainingRecords, result]
          setTrainingRecords(updatedRecords)
          onUpdate({ training_records: updatedRecords })
          toast.success('Data pelatihan berhasil ditambahkan')
        }

        setIsDialogOpen(false)
        setEditingRecord(null)
        setCertificateFile(null)
        form.reset()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Gagal menyimpan data pelatihan')
      }
    } catch (error) {
      console.error('Error saving training record:', error)
      toast.error('Terjadi kesalahan saat menyimpan data pelatihan')
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryLabel = (category: string) => {
    const option = TRAINING_CATEGORY_OPTIONS.find(opt => opt.value === category)
    return option?.label || category
  }

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'TEKNIS': return 'default'
      case 'MANAJERIAL': return 'secondary'
      case 'SOSIAL_KULTURAL': return 'outline'
      case 'FUNGSIONAL': return 'destructive'
      case 'KEPEMIMPINAN': return 'default'
      default: return 'default'
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
    const end = new Date(endDate).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
    return `${start} - ${end}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Pelatihan &amp; Pengembangan Kompetensi
          </CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pelatihan
          </Button>
        </CardHeader>
        <CardContent>
          {trainingRecords.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada data pelatihan</h3>
              <p className="text-muted-foreground mb-4">
                Tambahkan riwayat pelatihan dan pengembangan kompetensi Anda
              </p>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pelatihan Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {trainingRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getCategoryBadgeVariant(record.category)}>
                          {getCategoryLabel(record.category)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {record.duration_hours} jam
                        </span>
                      </div>
                      
                      <h4 className="font-semibold">{record.training_name}</h4>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {record.organizer}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateRange(record.start_date, record.end_date)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        📍 {record.location}
                      </p>
                      
                      {record.description && (
                        <p className="text-sm text-muted-foreground">
                          {record.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {record.certificate_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(record.certificate_url, '_blank')}
                        >
                          <Award className="w-4 h-4 mr-1" />
                          Sertifikat
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(record)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit Data Pelatihan' : 'Tambah Data Pelatihan'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="training_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pelatihan</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contoh: Pelatihan Manajemen Proyek" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TRAINING_CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Penyelenggara</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Contoh: BPSDM Kemendagri" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Mulai</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Selesai</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durasi (Jam)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Contoh: Jakarta / Online" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Tambahkan deskripsi pelatihan, materi yang dipelajari, atau catatan khusus..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Certificate Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sertifikat</label>
                <FileUpload
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={5 * 1024 * 1024} // 5MB
                  onFileSelect={(files) => setCertificateFile(files[0])}
                  className="w-full"
                >
                  <div className="text-center p-6">
                    <Award className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {certificateFile ? certificateFile.name : 'Upload Sertifikat'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Format: PDF, JPG, PNG. Maksimal 5MB
                    </p>
                  </div>
                </FileUpload>
                {editingRecord?.certificate_url && !certificateFile && (
                  <p className="text-xs text-muted-foreground">
                    Sertifikat saat ini: 
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto ml-1"
                      onClick={() => window.open(editingRecord.certificate_url, '_blank')}
                    >
                      Lihat sertifikat
                    </Button>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}