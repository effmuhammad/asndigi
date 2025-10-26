"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Edit, Trash2, FileText, Upload, Download, Eye } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface SkpMonthlyEntry {
  id: string
  sequence_number: number
  month: number
  year: number
  indicator: string
  action_plan: string
  target_realization: string
  supporting_data?: string
  feedback?: string
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
  user: {
    name: string
    nip: string
  }
  supervisor?: {
    name: string
  }
  files: SkpMonthlyFile[]
  created_at: string
  updated_at: string
}

interface SkpMonthlyFile {
  id: string
  file_name: string
  original_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_at: string
}

interface FormData {
  month: number
  year: number
  indicator: string
  actionPlan: string
  targetRealization: string
  supportingData: string
}

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" }
]

const STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800"
}

const STATUS_LABELS = {
  DRAFT: "Draft",
  SUBMITTED: "Diajukan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak"
}

export default function SkpBulananPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<SkpMonthlyEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<SkpMonthlyEntry | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState<FormData>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    indicator: "",
    actionPlan: "",
    targetRealization: "",
    supportingData: ""
  })

  // Load SKP entries
  const loadEntries = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/skp/monthly?year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.data || [])
      } else {
        toast.error("Gagal memuat data Sasaran Kinerja Pegawai")
      }
    } catch (error) {
      console.error("Error loading entries:", error)
      toast.error("Terjadi kesalahan saat memuat data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      loadEntries()
    }
  }, [session, selectedYear])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingEntry ? `/api/skp/monthly/${editingEntry.id}` : "/api/skp/monthly"
      const method = editingEntry ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingEntry ? "Sasaran Kinerja Pegawai berhasil diperbarui" : "Sasaran Kinerja Pegawai berhasil ditambahkan")
        setIsDialogOpen(false)
        setEditingEntry(null)
        resetForm()
        loadEntries()
      } else {
        const error = await response.json()
        toast.error(error.error || "Terjadi kesalahan")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Terjadi kesalahan saat menyimpan data")
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return

    try {
      const response = await fetch(`/api/skp/monthly/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Sasaran Kinerja Pegawai berhasil dihapus")
        loadEntries()
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal menghapus data")
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast.error("Terjadi kesalahan saat menghapus data")
    }
  }

  // Handle edit
  const handleEdit = (entry: SkpMonthlyEntry) => {
    setEditingEntry(entry)
    setFormData({
      month: entry.month,
      year: entry.year,
      indicator: entry.indicator,
      actionPlan: entry.action_plan,
      targetRealization: entry.target_realization,
      supportingData: entry.supporting_data || ""
    })
    setIsDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      indicator: "",
      actionPlan: "",
      targetRealization: "",
      supportingData: ""
    })
  }

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingEntry(null)
    resetForm()
  }

  // Generate years for selection
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sasaran Kinerja Pegawai</h1>
          <p className="text-muted-foreground">
            Kelola data Sasaran Kerja Pegawai (SKP) bulanan Anda
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah SKP
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Edit Sasaran Kinerja Pegawai" : "Tambah Sasaran Kinerja Pegawai"}
              </DialogTitle>
              <DialogDescription>
                {editingEntry ? "Perbarui data Sasaran Kinerja Pegawai" : "Tambahkan data Sasaran Kinerja Pegawai baru"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Bulan</Label>
                  <Select
                    value={formData.month.toString()}
                    onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="year">Tahun</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="indicator">Indikator</Label>
                <Input
                  id="indicator"
                  value={formData.indicator}
                  onChange={(e) => setFormData({ ...formData, indicator: e.target.value })}
                  placeholder="Masukkan indikator kinerja"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionPlan">Rencana Aksi</Label>
                <Textarea
                  id="actionPlan"
                  value={formData.actionPlan}
                  onChange={(e) => setFormData({ ...formData, actionPlan: e.target.value })}
                  placeholder="Masukkan rencana aksi"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetRealization">Realisasi Target</Label>
                <Textarea
                  id="targetRealization"
                  value={formData.targetRealization}
                  onChange={(e) => setFormData({ ...formData, targetRealization: e.target.value })}
                  placeholder="Masukkan realisasi target"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportingData">Data Dukung</Label>
                <Textarea
                  id="supportingData"
                  value={formData.supportingData}
                  onChange={(e) => setFormData({ ...formData, supportingData: e.target.value })}
                  placeholder="Masukkan data dukung (opsional)"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingEntry ? "Perbarui" : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tabel Rencana dan Realisasi</CardTitle>
              <CardDescription>
                SKP tahun {selectedYear}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <Label htmlFor="yearFilter">Tahun:</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Memuat data...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Belum ada data Sasaran Kinerja Pegawai untuk tahun {selectedYear}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">No.</TableHead>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Indikator</TableHead>
                    <TableHead>Rencana Aksi</TableHead>
                    <TableHead>Realisasi Target</TableHead>
                    <TableHead>Data Dukung</TableHead>
                    <TableHead>Feedback</TableHead>

                    <TableHead className="w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries
                    .sort((a, b) => a.month - b.month)
                    .reduce((acc, entry, index, sortedEntries) => {
                      const currentMonth = entry.month;
                      const prevMonth = index > 0 ? sortedEntries[index - 1].month : null;
                      
                      // Add month header if it's a new month
                      if (currentMonth !== prevMonth) {
                        const monthLabel = MONTHS.find(m => m.value === currentMonth)?.label;
                        acc.push(
                          <TableRow key={`month-header-${currentMonth}`} className="bg-muted/50">
                            <TableCell colSpan={8} className="font-semibold text-center py-3">
                              {monthLabel} (Bulan {currentMonth})
                            </TableCell>
                          </TableRow>
                        );
                      }
                      
                      // Add the actual data row
                      acc.push(
                        <TableRow key={entry.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {MONTHS.find(m => m.value === entry.month)?.label}
                          </TableCell>
                      <TableCell className="max-w-48">
                        <div className="truncate" title={entry.indicator}>
                          {entry.indicator}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <div className="truncate" title={entry.action_plan}>
                          {entry.action_plan}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <div className="truncate" title={entry.target_realization}>
                          {entry.target_realization}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32">
                        <div className="flex items-center space-x-2">
                          {entry.supporting_data && (
                            <div className="truncate text-sm" title={entry.supporting_data}>
                              {entry.supporting_data}
                            </div>
                          )}
                          {entry.files.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {entry.files.length} file
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32">
                        {entry.feedback ? (
                          <div className="truncate text-sm" title={entry.feedback}>
                            {entry.feedback}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                      );
                      
                      return acc;
                    }, [] as React.ReactElement[])}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}