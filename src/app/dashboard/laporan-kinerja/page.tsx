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
import { ClipboardCheck, Plus, Eye, Send, CheckCircle, XCircle, Clock, FileText, Calendar, User, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AttendanceSummary {
  totalDays: number
  presentDays: number
  percentage: number
}

interface SkpSummary {
  totalEntries: number
  completedEntries: number
  percentage: number
}

interface AnnualPerformanceReport {
  id: string
  user_id: string
  year: number
  attendance_summary: AttendanceSummary | null
  skp_summary: SkpSummary | null
  work_result_rating: "DIATAS_EKSPEKTASI" | "SESUAI_EKSPEKTASI" | "DIBAWAH_EKSPEKTASI"
  behavior_rating: "DIATAS_EKSPEKTASI" | "SESUAI_EKSPEKTASI" | "DIBAWAH_EKSPEKTASI"
  performance_predicate: "SANGAT_BAIK" | "BAIK" | "CUKUP" | "KURANG"
  ai_generated_summary?: string
  self_assessment?: string
  achievements?: string
  challenges?: string
  improvement_plan?: string
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
  submitted_at?: string
  approved_at?: string
  created_at: string
  updated_at: string
  user: {
    id: string
    name: string
    email: string
    nip: string
    position: string
    unit: string
  }
  supervisor_evaluation?: {
    id: string
    work_quality_score: number
    work_quantity_score: number
    punctuality_score: number
    cooperation_score: number
    initiative_score: number
    leadership_score?: number
    overall_rating: number
    supervisor_comments?: string
    recommendations?: string
    development_areas?: string
    strengths?: string
    supervisor: {
      name: string
      nip: string
    }
  }
  digital_signature?: {
    id: string
    signer: {
      name: string
      nip: string
    }
  }
}

export default function LaporanKinerjaPage() {
  const { data: session } = useSession()
  const [reports, setReports] = useState<AnnualPerformanceReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(2024)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewingReport, setViewingReport] = useState<AnnualPerformanceReport | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    year: 2024,
    self_assessment: "",
    achievements: "",
    challenges: "",
    improvement_plan: ""
  })

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      if (!session?.user?.id) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/annual-performance-reports?year=${selectedYear}&user_id=${session.user.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch reports')
        }
        const data = await response.json()
        setReports(data.reports || [])
      } catch (error) {
        console.error('Error fetching reports:', error)
        toast.error('Gagal memuat laporan kinerja')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [selectedYear, session?.user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      toast.error('Anda harus login terlebih dahulu')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/annual-performance-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: session.user.id,
          year: formData.year,
          self_assessment: formData.self_assessment,
          achievements: formData.achievements,
          challenges: formData.challenges,
          improvement_plan: formData.improvement_plan
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create report')
      }

      const data = await response.json()
      setReports(prev => [data.report, ...prev])
      setIsDialogOpen(false)
      setFormData({
        year: 2024,
        self_assessment: "",
        achievements: "",
        challenges: "",
        improvement_plan: ""
      })
      toast.success("Laporan kinerja berhasil dibuat")
    } catch (error: unknown) {
      console.error('Error creating report:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal membuat laporan kinerja')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReport = async (id: string) => {
    try {
      const response = await fetch(`/api/annual-performance-reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'SUBMITTED'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit report')
      }

      const data = await response.json()
      setReports(prev => prev.map(report => 
        report.id === id ? data.data : report
      ))
      toast.success("Laporan berhasil disubmit untuk approval")
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Gagal submit laporan')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>
      case "SUBMITTED":
        return <Badge variant="default">Menunggu Approval</Badge>
      case "APPROVED":
        return <Badge variant="default" className="bg-green-600">Disetujui</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Ditolak</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <FileText className="w-4 h-4" />
      case "SUBMITTED":
        return <Clock className="w-4 h-4" />
      case "APPROVED":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "DIATAS_EKSPEKTASI":
        return <Badge className="bg-green-600">Di Atas Ekspektasi</Badge>
      case "SESUAI_EKSPEKTASI":
        return <Badge className="bg-blue-600">Sesuai Ekspektasi</Badge>
      case "DIBAWAH_EKSPEKTASI":
        return <Badge className="bg-orange-600">Di Bawah Ekspektasi</Badge>
      default:
        return <Badge variant="secondary">{rating}</Badge>
    }
  }

  const getPredicateBadge = (predicate: string) => {
    switch (predicate) {
      case "SANGAT_BAIK":
        return <Badge className="bg-green-700">Sangat Baik</Badge>
      case "BAIK":
        return <Badge className="bg-green-600">Baik</Badge>
      case "CUKUP":
        return <Badge className="bg-yellow-600">Cukup</Badge>
      case "KURANG":
        return <Badge className="bg-red-600">Kurang</Badge>
      default:
        return <Badge variant="secondary">{predicate}</Badge>
    }
  }

  // Check if report already exists for selected year
  const reportExistsForYear = reports.some(report => report.year === formData.year)

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laporan Akhir Kinerja</h1>
          <p className="text-muted-foreground">Kelola laporan akhir kinerja ASN</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
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
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Buat Laporan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Buat Laporan Kinerja Tahunan Baru</DialogTitle>
                <DialogDescription>
                  Isi form di bawah untuk membuat laporan kinerja tahunan. Sistem akan otomatis menghitung data kehadiran dan SKP Anda.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="year">Tahun</Label>
                    <Select 
                      value={formData.year.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, year: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                      </SelectContent>
                    </Select>
                    {reportExistsForYear && (
                      <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Laporan untuk tahun ini sudah ada
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="self_assessment">Penilaian Diri</Label>
                    <Textarea
                      id="self_assessment"
                      placeholder="Tuliskan penilaian diri Anda terhadap kinerja tahun ini..."
                      value={formData.self_assessment}
                      onChange={(e) => setFormData(prev => ({ ...prev, self_assessment: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="achievements">Pencapaian</Label>
                    <Textarea
                      id="achievements"
                      placeholder="Tuliskan pencapaian-pencapaian penting tahun ini..."
                      value={formData.achievements}
                      onChange={(e) => setFormData(prev => ({ ...prev, achievements: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="challenges">Tantangan</Label>
                    <Textarea
                      id="challenges"
                      placeholder="Tuliskan tantangan yang dihadapi tahun ini..."
                      value={formData.challenges}
                      onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="improvement_plan">Rencana Perbaikan</Label>
                    <Textarea
                      id="improvement_plan"
                      placeholder="Tuliskan rencana perbaikan untuk tahun depan..."
                      value={formData.improvement_plan}
                      onChange={(e) => setFormData(prev => ({ ...prev, improvement_plan: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting || reportExistsForYear}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Membuat...
                      </>
                    ) : (
                      'Buat Laporan'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>



      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan Akhir Kinerja</CardTitle>
          <CardDescription>
            Kelola dan pantau status laporan akhir kinerja Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Memuat laporan...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Belum ada laporan</h3>
              <p className="text-muted-foreground mb-4">
                Anda belum memiliki laporan kinerja untuk tahun {selectedYear}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Laporan Pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Predikat Kinerja</TableHead>
                  <TableHead>Rating Hasil Kerja</TableHead>
                  <TableHead>Rating Perilaku</TableHead>
                  <TableHead>Kehadiran</TableHead>
                  <TableHead>SKP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.year}</TableCell>
                    <TableCell>{getPredicateBadge(report.performance_predicate)}</TableCell>
                    <TableCell>{getRatingBadge(report.work_result_rating)}</TableCell>
                    <TableCell>{getRatingBadge(report.behavior_rating)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={report.attendance_summary?.percentage || 0} className="w-16" />
                        <span className="text-sm">{(report.attendance_summary?.percentage || 0).toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={report.skp_summary?.percentage || 0} className="w-16" />
                        <span className="text-sm">{(report.skp_summary?.percentage || 0).toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(report.status)}
                        {getStatusBadge(report.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingReport(report)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {report.status === "DRAFT" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSubmitReport(report.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Report Dialog */}
      <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Laporan Kinerja Tahunan {viewingReport?.year}</DialogTitle>
            <DialogDescription>
              Laporan kinerja tahunan untuk {viewingReport?.user.name} ({viewingReport?.user.nip})
            </DialogDescription>
          </DialogHeader>
          
          {viewingReport && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Ringkasan</TabsTrigger>
                <TabsTrigger value="assessment">Penilaian Diri</TabsTrigger>
                <TabsTrigger value="supervisor">Evaluasi Atasan</TabsTrigger>
                <TabsTrigger value="signature">Tanda Tangan</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informasi Pegawai</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nama:</span>
                        <span className="font-medium">{viewingReport.user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">NIP:</span>
                        <span className="font-medium">{viewingReport.user.nip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Jabatan:</span>
                        <span className="font-medium">{viewingReport.user.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unit Kerja:</span>
                        <span className="font-medium">{viewingReport.user.unit}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Penilaian Kinerja</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Predikat Kinerja:</span>
                        {getPredicateBadge(viewingReport.performance_predicate)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Rating Hasil Kerja:</span>
                        {getRatingBadge(viewingReport.work_result_rating)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Rating Perilaku:</span>
                        {getRatingBadge(viewingReport.behavior_rating)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status:</span>
                        {getStatusBadge(viewingReport.status)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ringkasan Kehadiran</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Hari:</span>
                        <span className="font-medium">{viewingReport.attendance_summary?.totalDays || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hari Hadir:</span>
                        <span className="font-medium">{viewingReport.attendance_summary?.presentDays || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Persentase Kehadiran:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={viewingReport.attendance_summary?.percentage || 0} className="w-20" />
                          <span className="font-medium">{(viewingReport.attendance_summary?.percentage || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ringkasan SKP</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Entri:</span>
                        <span className="font-medium">{viewingReport.skp_summary?.totalEntries || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entri Selesai:</span>
                        <span className="font-medium">{viewingReport.skp_summary?.completedEntries || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Persentase Penyelesaian:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={viewingReport.skp_summary?.percentage || 0} className="w-20" />
                          <span className="font-medium">{(viewingReport.skp_summary?.percentage || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {viewingReport.ai_generated_summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ringkasan AI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {viewingReport.ai_generated_summary}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="assessment" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {viewingReport.self_assessment && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Penilaian Diri</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {viewingReport.self_assessment}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {viewingReport.achievements && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Pencapaian</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {viewingReport.achievements}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {viewingReport.challenges && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tantangan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {viewingReport.challenges}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {viewingReport.improvement_plan && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Rencana Perbaikan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {viewingReport.improvement_plan}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="supervisor" className="space-y-6">
                {viewingReport.supervisor_evaluation ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Informasi Evaluator</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nama Atasan:</span>
                          <span className="font-medium">{viewingReport.supervisor_evaluation.supervisor.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">NIP Atasan:</span>
                          <span className="font-medium">{viewingReport.supervisor_evaluation.supervisor.nip}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Skor Penilaian</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Kualitas Kerja:</span>
                            <span className="font-medium">{viewingReport.supervisor_evaluation.work_quality_score}/5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Kuantitas Kerja:</span>
                            <span className="font-medium">{viewingReport.supervisor_evaluation.work_quantity_score}/5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ketepatan Waktu:</span>
                            <span className="font-medium">{viewingReport.supervisor_evaluation.punctuality_score}/5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Kerjasama:</span>
                            <span className="font-medium">{viewingReport.supervisor_evaluation.cooperation_score}/5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Inisiatif:</span>
                            <span className="font-medium">{viewingReport.supervisor_evaluation.initiative_score}/5</span>
                          </div>
                          {viewingReport.supervisor_evaluation.leadership_score && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Kepemimpinan:</span>
                              <span className="font-medium">{viewingReport.supervisor_evaluation.leadership_score}/5</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Rating Keseluruhan:</span>
                            <span className="font-bold text-lg">{viewingReport.supervisor_evaluation.overall_rating}/5</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {viewingReport.supervisor_evaluation.supervisor_comments && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Komentar Atasan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {viewingReport.supervisor_evaluation.supervisor_comments}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {viewingReport.supervisor_evaluation.strengths && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Kekuatan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {viewingReport.supervisor_evaluation.strengths}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {viewingReport.supervisor_evaluation.development_areas && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Area Pengembangan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {viewingReport.supervisor_evaluation.development_areas}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {viewingReport.supervisor_evaluation.recommendations && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Rekomendasi</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {viewingReport.supervisor_evaluation.recommendations}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Belum Ada Evaluasi Atasan</h3>
                      <p className="text-muted-foreground">
                        Evaluasi dari atasan belum tersedia untuk laporan ini
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="signature" className="space-y-6">
                {viewingReport.digital_signature ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tanda Tangan Digital</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ditandatangani oleh:</span>
                        <span className="font-medium">{viewingReport.digital_signature.signer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">NIP:</span>
                        <span className="font-medium">{viewingReport.digital_signature.signer.nip}</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Belum Ditandatangani</h3>
                      <p className="text-muted-foreground">
                        Laporan ini belum memiliki tanda tangan digital
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}