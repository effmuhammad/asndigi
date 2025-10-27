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
import { Building2, Plus, Eye, TrendingUp, Users, Calendar, Award, FileText } from "lucide-react"
import { toast } from "sonner"

interface OrganizationalReport {
  id: string
  year: number
  total_employees: number
  average_attendance_rate: number
  average_skp_progress: number
  overall_performance_score: number
  predicate: "SANGAT_BAIK" | "BAIK" | "CUKUP" | "KURANG"
  summary?: string
  recommendations?: string
  created_at: string
  updated_at: string
  creator?: {
    id: string
    name: string
    nip: string
  }
}

const predicateLabels = {
  SANGAT_BAIK: "Sangat Baik",
  BAIK: "Baik", 
  CUKUP: "Cukup",
  KURANG: "Kurang"
}

const predicateColors = {
  SANGAT_BAIK: "bg-green-100 text-green-800 border-green-200",
  BAIK: "bg-blue-100 text-blue-800 border-blue-200",
  CUKUP: "bg-yellow-100 text-yellow-800 border-yellow-200",
  KURANG: "bg-red-100 text-red-800 border-red-200"
}

export default function LaporanOrganisasiPage() {
  const { data: session } = useSession()
  const [reports, setReports] = useState<OrganizationalReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [viewingReport, setViewingReport] = useState<OrganizationalReport | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [summary, setSummary] = useState("")
  const [recommendations, setRecommendations] = useState("")

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/organizational-reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      } else {
        toast.error('Gagal memuat laporan organisasi')
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateReport = async () => {
    if (!selectedYear) {
      toast.error('Pilih tahun terlebih dahulu')
      return
    }

    try {
      setIsCreating(true)
      const response = await fetch('/api/organizational-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: parseInt(selectedYear),
          summary,
          recommendations
        }),
      })

      if (response.ok) {
        const newReport = await response.json()
        setReports([newReport, ...reports])
        setCreateDialogOpen(false)
        setSummary("")
        setRecommendations("")
        toast.success('Laporan kinerja organisasi berhasil dibuat')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal membuat laporan')
      }
    } catch (error) {
      console.error('Error creating report:', error)
      toast.error('Terjadi kesalahan saat membuat laporan')
    } finally {
      setIsCreating(false)
    }
  }

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i.toString())
    }
    return years
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Laporan Capaian Kinerja Organisasi
          </h1>
          <p className="text-gray-600">
            Pantau dan kelola laporan kinerja organisasi tahunan
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Buat Laporan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat Laporan Kinerja Organisasi</DialogTitle>
              <DialogDescription>
                Sistem akan menghitung otomatis berdasarkan data kinerja pegawai
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="year">Tahun</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {getYearOptions().map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="summary">Ringkasan (Opsional)</Label>
                <Textarea
                  id="summary"
                  placeholder="Ringkasan kinerja organisasi tahun ini..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="recommendations">Rekomendasi (Opsional)</Label>
                <Textarea
                  id="recommendations"
                  placeholder="Rekomendasi untuk perbaikan kinerja..."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreateReport} disabled={isCreating}>
                {isCreating ? "Membuat..." : "Buat Laporan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Laporan</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">Laporan tersedia</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Skor</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reports.length > 0 ? (reports.reduce((sum, r) => sum + (r.overall_performance_score || 0), 0) / reports.length).toFixed(1) : "0.0"}
              </div>
              <p className="text-xs text-muted-foreground">Dari semua laporan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predikat Terbaru</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {predicateLabels[reports[0]?.predicate] || "-"}
              </div>
              <p className="text-xs text-muted-foreground">Tahun {reports[0]?.year}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pegawai Terbaru</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports[0]?.total_employees || 0}</div>
              <p className="text-xs text-muted-foreground">Total pegawai</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daftar Laporan Kinerja Organisasi
          </CardTitle>
          <CardDescription>
            Kelola dan pantau laporan kinerja organisasi tahunan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tahun</TableHead>
                    <TableHead>Total Pegawai</TableHead>
                    <TableHead>Tingkat Kehadiran</TableHead>
                    <TableHead>Progress SKP</TableHead>
                    <TableHead>Skor Kinerja</TableHead>
                    <TableHead>Predikat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Belum ada laporan kinerja organisasi. Klik "Buat Laporan" untuk memulai.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.year}</TableCell>
                        <TableCell>{report.total_employees} orang</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={report.average_attendance_rate || 0} className="w-16" />
                            <span className="text-sm">{(report.average_attendance_rate || 0).toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={report.average_skp_progress || 0} className="w-16" />
                            <span className="text-sm">{(report.average_skp_progress || 0).toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(report.overall_performance_score || 0).toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={predicateColors[report.predicate]}>
                            {predicateLabels[report.predicate]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingReport(report)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Report Dialog */}
      <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Laporan Kinerja Organisasi {viewingReport?.year}
            </DialogTitle>
            <DialogDescription>
              Detail lengkap laporan kinerja organisasi
            </DialogDescription>
          </DialogHeader>

          {viewingReport && (
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Ringkasan</TabsTrigger>
                  <TabsTrigger value="metrics">Metrik Kinerja</TabsTrigger>
                  <TabsTrigger value="analysis">Analisis</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Predikat Kinerja
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <Badge className={`${predicateColors[viewingReport.predicate]} text-lg px-4 py-2`}>
                            {predicateLabels[viewingReport.predicate]}
                          </Badge>
                          <p className="text-2xl font-bold mt-2">
                            {(viewingReport.overall_performance_score || 0).toFixed(1)}
                          </p>
                          <p className="text-sm text-muted-foreground">Skor Kinerja Keseluruhan</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Informasi Organisasi
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Pegawai:</span>
                          <span className="font-medium">{viewingReport.total_employees} orang</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tahun Laporan:</span>
                          <span className="font-medium">{viewingReport.year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dibuat oleh:</span>
                          <span className="font-medium">{viewingReport.creator?.name || "Sistem"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tingkat Kehadiran</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Rata-rata Kehadiran</span>
                          <Badge variant="outline">
                            {(viewingReport.average_attendance_rate || 0).toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress value={viewingReport.average_attendance_rate || 0} />
                        <p className="text-sm text-muted-foreground">
                          Berdasarkan data kehadiran seluruh pegawai
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Progress SKP</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Rata-rata Progress</span>
                          <Badge variant="outline">
                            {(viewingReport.average_skp_progress || 0).toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress value={viewingReport.average_skp_progress || 0} />
                        <p className="text-sm text-muted-foreground">
                          Berdasarkan SKP yang telah disetujui
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Breakdown Kinerja</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {viewingReport.total_employees}
                          </p>
                          <p className="text-sm text-muted-foreground">Total Pegawai</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {(viewingReport.average_attendance_rate || 0).toFixed(1)}%
                          </p>
                          <p className="text-sm text-muted-foreground">Tingkat Kehadiran</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">
                            {(viewingReport.average_skp_progress || 0).toFixed(1)}%
                          </p>
                          <p className="text-sm text-muted-foreground">Progress SKP</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  {viewingReport.summary && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Ringkasan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">{viewingReport.summary}</p>
                      </CardContent>
                    </Card>
                  )}

                  {viewingReport.recommendations && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Rekomendasi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm leading-relaxed whitespace-pre-wrap">
                          {viewingReport.recommendations}
                        </pre>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informasi Laporan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Tanggal Dibuat:</span>
                        <span className="font-medium">
                          {new Date(viewingReport.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Terakhir Diperbarui:</span>
                        <span className="font-medium">
                          {new Date(viewingReport.updated_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      {viewingReport.creator && (
                        <div className="flex justify-between">
                          <span>Dibuat oleh:</span>
                          <span className="font-medium">
                            {viewingReport.creator.name} ({viewingReport.creator.nip})
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingReport(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}