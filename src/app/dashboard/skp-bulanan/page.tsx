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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Brain, Loader2, Users, Calendar, AlertTriangle } from "lucide-react"
import { calculateDeadline, formatDeadline, isDeadlinePassed, getDaysUntilDeadline, isSubmissionLate } from "@/lib/deadline-utils"

interface SkpMonthlyEntry {
  id: string
  sequence_number: number
  month: number
  year: number
  indicator: string
  action_plan: string
  target_realization: string
  supporting_data?: string
  supporting_data_submission_date?: string
  feedback?: string
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
  deadline?: Date // Calculated deadline field
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

interface SkpMonthlyBehavior {
  id: string
  month: number
  year: number
  behavior: string
  feedback: string
  behavior_category?: string
  assessment_score?: number
  improvement_notes?: string
  user: {
    name: string
    nip: string
  }
  supervisor?: {
    name: string
  }
  created_by_user: {
    name: string
  }
  created_at: string
  updated_at: string
}

interface BehaviorFormData {
  month: number
  year: number
  behavior: string
  feedback: string
}

interface FormData {
  month: number
  year: number
  indicator: string
  actionPlan: string
  targetRealization: string
  supportingData: string
}

interface SkpSummaryResponse {
  summary: string
  analysis: {
    achievements: string[]
    challenges: string[]
    recommendations: string[]
  }
  performance_score: number
}

interface AiSummaryData {
  employee: {
    name: string
    nip: string
  }
  period: string
  total_entries: number
  summary: SkpSummaryResponse
  generated_at: string
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

export default function SkpBulananPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<SkpMonthlyEntry[]>([])
  const [behaviors, setBehaviors] = useState<SkpMonthlyBehavior[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBehaviorLoading, setIsBehaviorLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBehaviorDialogOpen, setIsBehaviorDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<SkpMonthlyEntry | null>(null)
  const [editingBehavior, setEditingBehavior] = useState<SkpMonthlyBehavior | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState("kinerja")
  const [aiSummary, setAiSummary] = useState<AiSummaryData | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [showAiSummary, setShowAiSummary] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    indicator: "",
    actionPlan: "",
    targetRealization: "",
    supportingData: ""
  })
  const [behaviorFormData, setBehaviorFormData] = useState<BehaviorFormData>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    behavior: "",
    feedback: ""
  })

  // Load entries from API
  const loadEntries = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/skp/monthly?year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        // Add deadline calculation to each entry
        const entriesWithDeadlines = (data.data || []).map((entry: SkpMonthlyEntry) => ({
          ...entry,
          deadline: calculateDeadline(entry.year, entry.month)
        }))
        setEntries(entriesWithDeadlines)
      } else {
        toast.error("Gagal memuat data SKP")
      }
    } catch (error) {
      console.error("Error loading entries:", error)
      toast.error("Terjadi kesalahan saat memuat data")
    } finally {
      setIsLoading(false)
    }
  }

  // Load behaviors from API
  const loadBehaviors = async () => {
    try {
      setIsBehaviorLoading(true)
      const response = await fetch(`/api/skp/monthly/behavior?year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setBehaviors(data.data || [])
      } else {
        toast.error("Gagal memuat data perilaku")
      }
    } catch (error) {
      console.error("Error loading behaviors:", error)
      toast.error("Terjadi kesalahan saat memuat data perilaku")
    } finally {
      setIsBehaviorLoading(false)
    }
  }

  // Load data when session or year changes
  useEffect(() => {
    if (session) {
      loadEntries()
      loadBehaviors()
    }
  }, [session, selectedYear])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingEntry ? `/api/skp/monthly/${editingEntry.id}` : '/api/skp/monthly'
      const method = editingEntry ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: formData.month,
          year: formData.year,
          indicator: formData.indicator,
          actionPlan: formData.actionPlan,
          targetRealization: formData.targetRealization,
          supportingData: formData.supportingData || undefined
        })
      })

      if (response.ok) {
        toast.success(editingEntry ? "SKP berhasil diperbarui" : "SKP berhasil ditambahkan")
        setIsDialogOpen(false)
        resetForm()
        loadEntries()
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal menyimpan data")
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
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("SKP berhasil dihapus")
        loadEntries()
      } else {
        toast.error("Gagal menghapus data")
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
    setEditingEntry(null)
  }

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  // Behavior form functions
  const handleBehaviorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingBehavior ? `/api/skp/monthly/behavior/${editingBehavior.id}` : '/api/skp/monthly/behavior'
      const method = editingBehavior ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: behaviorFormData.month,
          year: behaviorFormData.year,
          behavior: behaviorFormData.behavior,
          feedback: behaviorFormData.feedback
        })
      })

      if (response.ok) {
        toast.success(editingBehavior ? "Data perilaku berhasil diperbarui" : "Data perilaku berhasil ditambahkan")
        setIsBehaviorDialogOpen(false)
        resetBehaviorForm()
        loadBehaviors()
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal menyimpan data perilaku")
      }
    } catch (error) {
      console.error("Error submitting behavior form:", error)
      toast.error("Terjadi kesalahan saat menyimpan data perilaku")
    }
  }

  const handleBehaviorDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data perilaku ini?")) return

    try {
      const response = await fetch(`/api/skp/monthly/behavior/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Data perilaku berhasil dihapus")
        loadBehaviors()
      } else {
        toast.error("Gagal menghapus data perilaku")
      }
    } catch (error) {
      console.error("Error deleting behavior:", error)
      toast.error("Terjadi kesalahan saat menghapus data perilaku")
    }
  }

  const handleBehaviorEdit = (behavior: SkpMonthlyBehavior) => {
    setEditingBehavior(behavior)
    setBehaviorFormData({
      month: behavior.month,
      year: behavior.year,
      behavior: behavior.behavior,
      feedback: behavior.feedback
    })
    setIsBehaviorDialogOpen(true)
  }

  const resetBehaviorForm = () => {
    setBehaviorFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      behavior: "",
      feedback: ""
    })
    setEditingBehavior(null)
  }

  const handleBehaviorDialogClose = () => {
    setIsBehaviorDialogOpen(false)
    resetBehaviorForm()
  }

  // Generate years for selection
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  // Generate AI Summary
  const generateAiSummary = async () => {
    try {
      setIsGeneratingSummary(true)
      const response = await fetch('/api/skp/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          year: selectedYear
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiSummary(data.data)
        setShowAiSummary(true)
        toast.success("Ringkasan AI berhasil dibuat")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal membuat ringkasan AI")
      }
    } catch (error) {
      console.error("Error generating AI summary:", error)
      toast.error("Terjadi kesalahan saat membuat ringkasan AI")
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sasaran Kinerja Pegawai</h1>
          <p className="text-muted-foreground">
            Kelola data Sasaran Kerja Pegawai (SKP) bulanan Anda
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={generateAiSummary}
            disabled={isGeneratingSummary || entries.length === 0}
          >
            {isGeneratingSummary ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {isGeneratingSummary ? "Membuat Ringkasan..." : "Ringkasan AI"}
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kinerja
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
                  <Label htmlFor="supportingData">Bukti Data Dukung</Label>
                  <Textarea
                    id="supportingData"
                    value={formData.supportingData}
                    onChange={(e) => setFormData({ ...formData, supportingData: e.target.value })}
                    placeholder="Masukkan data dukung"
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
          
          <Dialog open={isBehaviorDialogOpen} onOpenChange={setIsBehaviorDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setIsBehaviorDialogOpen(true)}>
                <Users className="h-4 w-4 mr-2" />
                Tambah Perilaku
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingBehavior ? "Edit Data Perilaku" : "Tambah Data Perilaku"}
                </DialogTitle>
                <DialogDescription>
                  {editingBehavior ? "Perbarui data perilaku pegawai" : "Tambahkan data perilaku pegawai baru"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleBehaviorSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Bulan</Label>
                    <Select
                      value={behaviorFormData.month.toString()}
                      onValueChange={(value) => setBehaviorFormData({ ...behaviorFormData, month: parseInt(value) })}
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
                      value={behaviorFormData.year.toString()}
                      onValueChange={(value) => setBehaviorFormData({ ...behaviorFormData, year: parseInt(value) })}
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
                  <Label htmlFor="behavior">Perilaku</Label>
                  <Textarea
                    id="behavior"
                    placeholder="Masukkan deskripsi perilaku..."
                    value={behaviorFormData.behavior}
                    onChange={(e) => setBehaviorFormData({ ...behaviorFormData, behavior: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Masukkan feedback..."
                    value={behaviorFormData.feedback}
                    onChange={(e) => setBehaviorFormData({ ...behaviorFormData, feedback: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleBehaviorDialogClose}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingBehavior ? "Perbarui" : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Summary Card */}
      {showAiSummary && aiSummary && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">Ringkasan AI - Kinerja SKP</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAiSummary(false)}
              >
                ×
              </Button>
            </div>
            <CardDescription className="text-blue-700">
              {aiSummary.period} • {aiSummary.total_entries} entri SKP • 
              Skor Kinerja: {aiSummary.summary.performance_score}/100
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Executive Summary */}
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Ringkasan Eksekutif</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                {aiSummary.summary.summary}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Achievements */}
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Pencapaian
                </h4>
                <ul className="space-y-1">
                  {aiSummary.summary.analysis.achievements.map((achievement, index) => (
                    <li key={index} className="text-sm text-green-700 pl-4 relative">
                      <span className="absolute left-0 top-2 w-1 h-1 bg-green-400 rounded-full"></span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Challenges */}
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-700 flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Tantangan
                </h4>
                <ul className="space-y-1">
                  {aiSummary.summary.analysis.challenges.map((challenge, index) => (
                    <li key={index} className="text-sm text-orange-700 pl-4 relative">
                      <span className="absolute left-0 top-2 w-1 h-1 bg-orange-400 rounded-full"></span>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-700 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Rekomendasi
                </h4>
                <ul className="space-y-1">
                  {aiSummary.summary.analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-purple-700 pl-4 relative">
                      <span className="absolute left-0 top-2 w-1 h-1 bg-purple-400 rounded-full"></span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Performance Score */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Skor Kinerja</span>
                <span className="text-lg font-bold text-blue-900">
                  {aiSummary.summary.performance_score}/100
                </span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${aiSummary.summary.performance_score}%` }}
                ></div>
              </div>
            </div>

            <div className="text-xs text-blue-600 text-right">
              Dibuat pada: {new Date(aiSummary.generated_at).toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="kinerja">Kinerja</TabsTrigger>
          <TabsTrigger value="perilaku">Perilaku</TabsTrigger>
        </TabsList>
        
        {/* Kinerja Tab */}
        <TabsContent value="kinerja">
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
                        <TableHead>Indikator</TableHead>
                        <TableHead>Rencana Aksi</TableHead>
                        <TableHead>Realisasi Target</TableHead>
                        <TableHead>Bukti Data Dukung</TableHead>
                        <TableHead>Tanggal Pengumpulan</TableHead>
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
                              <TableCell className="min-w-48">
                                <div className="whitespace-normal break-words">
                                  {entry.indicator}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-48">
                                <div className="whitespace-normal break-words">
                                  {entry.action_plan}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-48">
                                <div className="whitespace-normal break-words">
                                  {entry.target_realization}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-32">
                                <div className="flex flex-col space-y-2">
                                  {entry.supporting_data && (
                                    <div className="whitespace-normal break-words text-sm">
                                      {entry.supporting_data}
                                    </div>
                                  )}
                                  {entry.files.length > 0 && (
                                    <Badge variant="secondary" className="text-xs w-fit">
                                      {entry.files.length} file
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-32">
                                {entry.supporting_data_submission_date ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="text-sm">
                                      {new Date(entry.supporting_data_submission_date).toLocaleDateString('id-ID')}
                                    </div>
                                    {entry.deadline && isSubmissionLate(entry.supporting_data_submission_date, entry.deadline) ? (
                                      <div className="flex items-center gap-1 text-red-600">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span className="text-xs font-medium">Terlewat</span>
                                      </div>
                                    ) : entry.deadline && (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <Calendar className="h-3 w-3" />
                                        <span className="text-xs font-medium">Tepat Waktu</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="min-w-32">
                                {entry.feedback ? (
                                  <div className="whitespace-normal break-words text-sm">
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
        </TabsContent>
        
        {/* Perilaku Tab */}
        <TabsContent value="perilaku">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tabel Data Perilaku</CardTitle>
                  <CardDescription>
                    Data perilaku pegawai tahun {selectedYear}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="yearFilterBehavior">Tahun:</Label>
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
              {isBehaviorLoading ? (
                <div className="text-center py-8">
                  <p>Memuat data perilaku...</p>
                </div>
              ) : behaviors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada data perilaku untuk tahun {selectedYear}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">No.</TableHead>
                        <TableHead>Perilaku</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead className="w-32">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {behaviors
                        .sort((a, b) => a.month - b.month)
                        .reduce((acc, behavior, index, sortedBehaviors) => {
                          const currentMonth = behavior.month;
                          const prevMonth = index > 0 ? sortedBehaviors[index - 1].month : null;
                          
                          // Add month header if it's a new month
                          if (currentMonth !== prevMonth) {
                            const monthLabel = MONTHS.find(m => m.value === currentMonth)?.label;
                            acc.push(
                              <TableRow key={`month-header-${currentMonth}`} className="bg-muted/50">
                                <TableCell colSpan={4} className="font-semibold text-center py-3">
                                  {monthLabel} (Bulan {currentMonth})
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          // Add the actual data row
                          acc.push(
                            <TableRow key={behavior.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="min-w-48">
                                <div className="whitespace-normal break-words">
                                  {behavior.behavior}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-48">
                                <div className="whitespace-normal break-words">
                                  {behavior.feedback}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBehaviorEdit(behavior)}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBehaviorDelete(behavior.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}