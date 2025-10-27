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
import { FileText, Plus, Edit, Trash2, Download, Calendar, Building } from "lucide-react"
import { skHistorySchema, type SkHistoryFormData, SK_TYPE_OPTIONS } from "@/lib/validations/profile"

interface SkHistoryTabProps {
  profileData: any
  onUpdate: (data: any) => void
}

interface SkRecord {
  id: string
  sk_number: string
  sk_type: string
  position: string
  work_unit: string
  effective_date: string
  description?: string
  document_url?: string
  created_at: string
}

export function SkHistoryTab({ profileData, onUpdate }: SkHistoryTabProps) {
  const [skRecords, setSkRecords] = useState<SkRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SkRecord | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  const form = useForm<SkHistoryFormData>({
    resolver: zodResolver(skHistorySchema),
    defaultValues: {
      sk_number: "",
      sk_type: "",
      position: "",
      work_unit: "",
      effective_date: "",
      description: "",
    }
  })

  useEffect(() => {
    if (profileData?.sk_history) {
      setSkRecords(profileData.sk_history)
    } else {
      fetchSkHistory()
    }
  }, [profileData])

  const fetchSkHistory = async () => {
    try {
      const response = await fetch('/api/profile/sk')
      if (response.ok) {
        const data = await response.json()
        setSkRecords(data)
      }
    } catch (error) {
      console.error('Error fetching SK history:', error)
    }
  }

  const handleDocumentUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'sk')

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
      console.error('Error uploading document:', error)
      toast.error('Gagal mengupload dokumen')
      return null
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    setDocumentFile(null)
    form.reset({
      sk_number: "",
      sk_type: "",
      position: "",
      work_unit: "",
      effective_date: "",
      description: "",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (record: SkRecord) => {
    setEditingRecord(record)
    setDocumentFile(null)
    form.reset({
      sk_number: record.sk_number,
      sk_type: record.sk_type,
      position: record.position,
      work_unit: record.work_unit,
      effective_date: record.effective_date,
      description: record.description || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data SK ini?')) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/profile/sk/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const updatedRecords = skRecords.filter(record => record.id !== id)
        setSkRecords(updatedRecords)
        onUpdate({ sk_history: updatedRecords })
        toast.success('Data SK berhasil dihapus')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Gagal menghapus data SK')
      }
    } catch (error) {
      console.error('Error deleting SK record:', error)
      toast.error('Terjadi kesalahan saat menghapus data SK')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: SkHistoryFormData) => {
    try {
      setIsLoading(true)

      let documentUrl = editingRecord?.document_url
      if (documentFile) {
        documentUrl = await handleDocumentUpload(documentFile)
        if (!documentUrl) return
      }

      const submitData = {
        ...data,
        document_url: documentUrl,
      }

      const url = editingRecord 
        ? `/api/profile/sk/${editingRecord.id}`
        : '/api/profile/sk'
      
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
          const updatedRecords = skRecords.map(record => 
            record.id === editingRecord.id ? result : record
          )
          setSkRecords(updatedRecords)
          onUpdate({ sk_history: updatedRecords })
          toast.success('Data SK berhasil diperbarui')
        } else {
          const updatedRecords = [...skRecords, result]
          setSkRecords(updatedRecords)
          onUpdate({ sk_history: updatedRecords })
          toast.success('Data SK berhasil ditambahkan')
        }

        setIsDialogOpen(false)
        setEditingRecord(null)
        setDocumentFile(null)
        form.reset()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Gagal menyimpan data SK')
      }
    } catch (error) {
      console.error('Error saving SK record:', error)
      toast.error('Terjadi kesalahan saat menyimpan data SK')
    } finally {
      setIsLoading(false)
    }
  }

  const getSkTypeLabel = (type: string) => {
    const option = SK_TYPE_OPTIONS.find(opt => opt.value === type)
    return option?.label || type
  }

  const getSkTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'PENGANGKATAN': return 'default'
      case 'MUTASI': return 'secondary'
      case 'PROMOSI': return 'outline'
      case 'PEMBERHENTIAN': return 'destructive'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Riwayat SK Jabatan
          </CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah SK
          </Button>
        </CardHeader>
        <CardContent>
          {skRecords.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada data SK</h3>
              <p className="text-muted-foreground mb-4">
                Tambahkan riwayat Surat Keputusan jabatan Anda
              </p>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah SK Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {skRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSkTypeBadgeVariant(record.sk_type)}>
                          {getSkTypeLabel(record.sk_type)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {record.sk_number}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold">{record.position}</h4>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {record.work_unit}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(record.effective_date).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      
                      {record.description && (
                        <p className="text-sm text-muted-foreground">
                          {record.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {record.document_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(record.document_url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
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
              {editingRecord ? 'Edit Data SK' : 'Tambah Data SK'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sk_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor SK</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Contoh: 123/SK/2024" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sk_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis SK</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis SK" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SK_TYPE_OPTIONS.map((option) => (
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
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jabatan</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Contoh: Kepala Bagian IT" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="work_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Kerja</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Contoh: Dinas Komunikasi dan Informatika" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="effective_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Berlaku</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
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
                    <FormLabel>Keterangan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Tambahkan keterangan atau catatan khusus..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Document Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Dokumen SK</label>
                <FileUpload
                  accept=".pdf,.doc,.docx"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileSelect={(files) => setDocumentFile(files[0])}
                  className="w-full"
                >
                  <div className="text-center p-6">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {documentFile ? documentFile.name : 'Upload Dokumen SK'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Format: PDF, DOC, DOCX. Maksimal 10MB
                    </p>
                  </div>
                </FileUpload>
                {editingRecord?.document_url && !documentFile && (
                  <p className="text-xs text-muted-foreground">
                    Dokumen saat ini: 
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto ml-1"
                      onClick={() => window.open(editingRecord.document_url, '_blank')}
                    >
                      Lihat dokumen
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