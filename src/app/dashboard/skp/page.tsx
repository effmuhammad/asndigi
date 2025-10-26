"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, Plus, Edit, Upload, FileText, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import { FileUpload } from "@/components/ui/file-upload"

interface SkpItem {
  id: string
  no: number
  indicator: string
  action_plan: string
  target: string
  unit: string
  weight: number
  realization?: string
  progress_percentage: number
  evidence_files: string[]
  notes?: string
  feedback?: string
}

export default function SkpPage() {
  const { data: session } = useSession()
  const [skpItems, setSkpItems] = useState<SkpItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SkpItem | null>(null)
  const [showRealizationDialog, setShowRealizationDialog] = useState(false)
  const [selectedSkp, setSelectedSkp] = useState<SkpItem | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [formData, setFormData] = useState({
    indicator: "",
    action_plan: "",
    target: "",
    unit: "",
    weight: 0
  })

  // Load SKP data
  useEffect(() => {
    loadSkpData()
  }, [selectedYear])

  const loadSkpData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/skp?year=${selectedYear}`)
      
      if (response.ok) {
        const data = await response.json()
        setSkpItems(data.skpItems || [])
      } else {
        // Use mock data if API fails
        const mockData: SkpItem[] = [
          {
            id: "1",
            no: 1,
            indicator: "Meningkatkan kualitas pelayanan publik",
            action_plan: "Melakukan pelatihan customer service dan implementasi sistem antrian digital",
            target: "90",
            unit: "Persen",
            weight: 25,
            realization: "Telah melakukan 3 kali pelatihan dan implementasi sistem antrian di 2 lokasi",
            progress_percentage: 85,
            evidence_files: ["sertifikat-pelatihan.pdf", "laporan-implementasi.pdf"],
            notes: "Progres berjalan sesuai rencana",
            feedback: "Perlu ditingkatkan lagi untuk mencapai target 90%"
          },
          {
            id: "2",
            no: 2,
            indicator: "Menyelesaikan laporan keuangan tepat waktu",
            action_plan: "Membuat jadwal rutin penyusunan laporan dan koordinasi dengan tim keuangan",
            target: "100",
            unit: "Persen",
            weight: 20,
            realization: "Semua laporan bulanan telah diselesaikan tepat waktu",
            progress_percentage: 100,
            evidence_files: ["laporan-jan.pdf", "laporan-feb.pdf", "laporan-mar.pdf"],
            notes: "Target tercapai dengan baik",
            feedback: "Excellent! Pertahankan konsistensi ini"
          },
          {
            id: "3",
            no: 3,
            indicator: "Mengembangkan sistem informasi internal",
            action_plan: "Analisis kebutuhan, desain sistem, dan implementasi bertahap",
            target: "1",
            unit: "Sistem",
            weight: 30,
            realization: "Tahap analisis dan desain telah selesai, implementasi 60%",
            progress_percentage: 60,
            evidence_files: ["dokumen-analisis.pdf", "desain-sistem.pdf"],
            notes: "Sedang dalam tahap implementasi",
            feedback: "Progres baik, pastikan selesai sesuai timeline"
          }
        ]
        setSkpItems(mockData)
      }
    } catch (error) {
      console.error("Error loading SKP data:", error)
      toast.error("Gagal memuat data SKP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingItem) {
        // Update existing item
        const response = await fetch(`/api/skp/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          throw new Error("Failed to update SKP")
        }

        toast.success("SKP berhasil diperbarui")
      } else {
        // Add new item
        const response = await fetch("/api/skp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...formData,
            year: selectedYear
          })
        })

        if (!response.ok) {
          throw new Error("Failed to create SKP")
        }

        toast.success("SKP berhasil ditambahkan")
      }

      setIsDialogOpen(false)
      setEditingItem(null)
      setFormData({
        indicator: "",
        action_plan: "",
        target: "",
        unit: "",
        weight: 0
      })
      
      // Reload data
      loadSkpData()
    } catch (error: any) {
      console.error("Submit error:", error)
      toast.error(error.message || "Gagal menyimpan SKP")
    }
  }

  const handleEdit = (item: SkpItem) => {
    setEditingItem(item)
    setFormData({
      indicator: item.indicator,
      action_plan: item.action_plan,
      target: item.target,
      unit: item.unit,
      weight: item.weight
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/skp/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete SKP")
      }

      toast.success("SKP berhasil dihapus")
      loadSkpData()
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error(error.message || "Gagal menghapus SKP")
    }
  }

  const handleAddRealization = async (skpId: string, data: any) => {
    try {
      const response = await fetch(`/api/skp/${skpId}/realization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add realization")
      }

      toast.success("Realisasi berhasil ditambahkan")
      setShowRealizationDialog(false)
      setSelectedSkp(null)
      setUploadedFiles([])
      
      // Refresh SKP data
      loadSkpData()
    } catch (error: any) {
      console.error("Add realization error:", error)
      toast.error(error.message || "Gagal menambahkan realisasi")
    }
  }

  const totalBobot = skpItems.reduce((sum, item) => sum + item.weight, 0)
  const averageProgress = skpItems.length > 0 
    ? skpItems.reduce((sum, item) => sum + item.progress_percentage, 0) / skpItems.length 
    : 0

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-green-500"
    if (progress >= 70) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-none p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Memuat data SKP...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-none p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SKP (Sasaran Kinerja Pegawai)</h1>
          <p className="text-muted-foreground">Kelola sasaran kinerja dan realisasi pencapaian</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tambah SKP
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit SKP" : "Tambah SKP Baru"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Perbarui data SKP" : "Tambahkan sasaran kinerja pegawai baru"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="indicator">Indikator Kinerja</Label>
                    <Input
                      id="indicator"
                      value={formData.indicator}
                      onChange={(e) => setFormData(prev => ({ ...prev, indicator: e.target.value }))}
                      placeholder="Masukkan indikator kinerja"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="action_plan">Rencana Aksi</Label>
                    <Textarea
                      id="action_plan"
                      value={formData.action_plan}
                      onChange={(e) => setFormData(prev => ({ ...prev, action_plan: e.target.value }))}
                      placeholder="Jelaskan rencana aksi untuk mencapai target"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="target">Target</Label>
                      <Input
                        id="target"
                        value={formData.target}
                        onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                        placeholder="Nilai target"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Satuan</Label>
                      <Input
                        id="unit"
                        value={formData.unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        placeholder="Satuan pengukuran"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="weight">Bobot (%)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      placeholder="Bobot dalam persen"
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingItem ? "Perbarui" : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKP</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skpItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Item sasaran kinerja
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bobot</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBobot}%</div>
            <p className="text-xs text-muted-foreground">
              {totalBobot === 100 ? "Bobot sudah sesuai" : "Bobot belum 100%"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProgress.toFixed(1)}%</div>
            <Progress value={averageProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* SKP Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar SKP Tahun {selectedYear}</CardTitle>
          <CardDescription>
            Kelola dan pantau progress sasaran kinerja pegawai
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skpItems.length === 0 ? (
            <div className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Belum ada SKP</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Mulai dengan menambahkan sasaran kinerja pegawai pertama Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Indikator</TableHead>
                    <TableHead>Rencana Aksi</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Bobot</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skpItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.no}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium">{item.indicator}</p>
                          {item.feedback && (
                            <p className="text-xs text-muted-foreground mt-1">
                              💬 {item.feedback}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-sm text-sm">
                          {item.action_plan}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.target} {item.unit}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.weight}%</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Progress value={item.progress_percentage} className="flex-1" />
                            <span className="text-sm font-medium w-12">
                              {item.progress_percentage}%
                            </span>
                          </div>
                          {item.realization && (
                            <p className="text-xs text-muted-foreground">
                              {item.realization}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSkp(item)
                              setShowRealizationDialog(true)
                            }}
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Realization Dialog */}
      {selectedSkp && (
        <Dialog open={showRealizationDialog} onOpenChange={setShowRealizationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Realisasi</DialogTitle>
              <DialogDescription>
                Tambahkan realisasi untuk: {selectedSkp.indikator}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const data = {
                description: formData.get("description"),
                achievement_percentage: Number(formData.get("achievement_percentage")),
                evidence_files: uploadedFiles.map(f => f.url)
              }
              handleAddRealization(selectedSkp.id, data)
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Deskripsi Realisasi</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Jelaskan realisasi yang telah dicapai..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="achievement_percentage">Persentase Pencapaian (%)</Label>
                  <Input
                    id="achievement_percentage"
                    name="achievement_percentage"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    required
                  />
                </div>
                <div>
                  <Label>Bukti Data Dukung</Label>
                  <FileUpload
                    onUpload={setUploadedFiles}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    multiple={true}
                    maxSize={10}
                    uploadType="document"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowRealizationDialog(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  Simpan Realisasi
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}