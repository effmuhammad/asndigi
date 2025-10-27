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
import { ClipboardCheck, Plus, Eye, Send, CheckCircle, XCircle, Clock, FileText, Calendar, User } from "lucide-react"
import { toast } from "sonner"

interface AttendanceSummary {
  total_days: number
  present_days: number
  late_days: number
  absent_days: number
  attendance_percentage: number
}

interface SkpSummary {
  total_items: number
  completed_items: number
  average_progress: number
  total_weight: number
}

interface PerformanceReport {
  id: string
  period: string
  month: number
  year: number
  attendance_summary: AttendanceSummary
  skp_summary: SkpSummary
  self_assessment: string
  achievements: string
  challenges: string
  improvement_plan: string
  status: "draft" | "submitted" | "approved" | "rejected"
  submitted_at?: string
  approved_at?: string
  approver_name?: string
  feedback?: string
  created_at: string
}

export default function LaporanKinerjaPage() {
  const { data: session } = useSession()
  const [reports, setReports] = useState<PerformanceReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewingReport, setViewingReport] = useState<PerformanceReport | null>(null)
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    self_assessment: "",
    achievements: "",
    challenges: "",
    improvement_plan: ""
  })

  // Mock data
  useEffect(() => {
    const mockReports: PerformanceReport[] = [
      {
        id: "1",
        period: "Maret 2024",
        month: 3,
        year: 2024,
        attendance_summary: {
          total_days: 21,
          present_days: 20,
          late_days: 2,
          absent_days: 1,
          attendance_percentage: 95.2
        },
        skp_summary: {
          total_items: 5,
          completed_items: 4,
          average_progress: 82.5,
          total_weight: 100
        },
        self_assessment: "Secara keseluruhan, kinerja bulan ini cukup baik dengan pencapaian target yang memuaskan. Tingkat kehadiran mencapai 95% dan sebagian besar SKP telah terealisasi sesuai rencana.",
        achievements: "1. Berhasil menyelesaikan implementasi sistem antrian digital\n2. Menyelesaikan 4 dari 5 target SKP dengan baik\n3. Mengikuti 2 pelatihan pengembangan kompetensi\n4. Koordinasi dengan stakeholder berjalan lancar",
        challenges: "1. Kendala teknis pada implementasi sistem di lokasi kedua\n2. Keterlambatan approval dari pihak eksternal\n3. Beban kerja yang cukup tinggi di akhir bulan",
        improvement_plan: "1. Melakukan koordinasi lebih intensif dengan tim IT\n2. Follow up rutin untuk proses approval\n3. Mengatur prioritas kerja dengan lebih baik\n4. Meningkatkan komunikasi dengan tim",
        status: "approved",
        submitted_at: "2024-04-02T10:30:00Z",
        approved_at: "2024-04-05T14:15:00Z",
        approver_name: "Dr. Siti Nurhaliza, M.Si",
        feedback: "Laporan sangat baik dan komprehensif. Pencapaian target memuaskan. Pertahankan konsistensi kinerja.",
        created_at: "2024-04-01T08:00:00Z"
      },
      {
        id: "2",
        period: "Februari 2024",
        month: 2,
        year: 2024,
        attendance_summary: {
          total_days: 20,
          present_days: 19,
          late_days: 1,
          absent_days: 1,
          attendance_percentage: 95.0
        },
        skp_summary: {
          total_items: 5,
          completed_items: 3,
          average_progress: 75.0,
          total_weight: 100
        },
        self_assessment: "Kinerja bulan ini mengalami sedikit penurunan dibanding bulan sebelumnya, namun masih dalam batas wajar. Beberapa target SKP mengalami keterlambatan.",
        achievements: "1. Menyelesaikan laporan keuangan tepat waktu\n2. Melakukan 3 kali koordinasi dengan mitra kerja\n3. Mengikuti workshop pengembangan SDM",
        challenges: "1. Keterlambatan dalam pengembangan sistem informasi\n2. Koordinasi dengan vendor yang kurang optimal\n3. Sakit selama 1 hari",
        improvement_plan: "1. Mempercepat koordinasi dengan tim pengembang\n2. Membuat jadwal follow up yang lebih ketat\n3. Menjaga kesehatan dengan lebih baik",
        status: "approved",
        submitted_at: "2024-03-01T09:15:00Z",
        approved_at: "2024-03-03T16:20:00Z",
        approver_name: "Dr. Siti Nurhaliza, M.Si",
        feedback: "Perlu peningkatan dalam manajemen waktu dan koordinasi proyek. Overall masih acceptable.",
        created_at: "2024-02-29T08:00:00Z"
      },
      {
        id: "3",
        period: "Januari 2024",
        month: 1,
        year: 2024,
        attendance_summary: {
          total_days: 22,
          present_days: 22,
          late_days: 0,
          absent_days: 0,
          attendance_percentage: 100.0
        },
        skp_summary: {
          total_items: 5,
          completed_items: 5,
          average_progress: 90.0,
          total_weight: 100
        },
        self_assessment: "Awal tahun yang sangat baik dengan pencapaian sempurna dalam kehadiran dan hampir semua target SKP tercapai dengan baik.",
        achievements: "1. Perfect attendance sepanjang bulan\n2. Semua target SKP tercapai\n3. Inisiasi proyek sistem informasi baru\n4. Pelatihan customer service berhasil dilaksanakan",
        challenges: "1. Adaptasi dengan target baru di awal tahun\n2. Koordinasi dengan tim baru",
        improvement_plan: "1. Mempertahankan konsistensi kinerja\n2. Meningkatkan inovasi dalam pelayanan\n3. Mengoptimalkan kerja tim",
        status: "approved",
        submitted_at: "2024-02-01T08:30:00Z",
        approved_at: "2024-02-02T11:45:00Z",
        approver_name: "Dr. Siti Nurhaliza, M.Si",
        feedback: "Excellent performance! Pertahankan konsistensi ini sepanjang tahun.",
        created_at: "2024-01-31T08:00:00Z"
      }
    ]

    setTimeout(() => {
      setReports(mockReports.filter(report => report.year === selectedYear))
      setIsLoading(false)
    }, 1000)
  }, [selectedYear])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mock attendance and SKP data for the selected month
    const mockAttendance: AttendanceSummary = {
      total_days: 21,
      present_days: 20,
      late_days: 1,
      absent_days: 1,
      attendance_percentage: 95.2
    }

    const mockSkp: SkpSummary = {
      total_items: 5,
      completed_items: 4,
      average_progress: 80.0,
      total_weight: 100
    }

    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]

    const newReport: PerformanceReport = {
      id: Math.random().toString(36).substr(2, 9),
      period: `${monthNames[formData.month - 1]} ${formData.year}`,
      month: formData.month,
      year: formData.year,
      attendance_summary: mockAttendance,
      skp_summary: mockSkp,
      self_assessment: formData.self_assessment,
      achievements: formData.achievements,
      challenges: formData.challenges,
      improvement_plan: formData.improvement_plan,
      status: "draft",
      created_at: new Date().toISOString()
    }

    setReports(prev => [newReport, ...prev])
    setIsDialogOpen(false)
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      self_assessment: "",
      achievements: "",
      challenges: "",
      improvement_plan: ""
    })
    toast.success("Laporan kinerja berhasil dibuat")
  }

  const handleSubmitReport = (id: string) => {
    setReports(prev => prev.map(report => 
      report.id === id 
        ? { 
            ...report, 
            status: "submitted", 
            submitted_at: new Date().toISOString() 
          }
        : report
    ))
    toast.success("Laporan berhasil disubmit untuk approval")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "submitted":
        return <Badge variant="default">Menunggu Approval</Badge>
      case "approved":
        return <Badge variant="default" className="bg-green-600">Disetujui</Badge>
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="w-4 h-4" />
      case "submitted":
        return <Clock className="w-4 h-4" />
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]

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
                <DialogTitle>Buat Laporan Kinerja Baru</DialogTitle>
                <DialogDescription>
                  Isi form di bawah untuk membuat laporan kinerja bulanan
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Bulan</Label>
                    <Select value={formData.month.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, month: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthNames.map((month, index) => (
                          <SelectItem key={index} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Tahun</Label>
                    <Select value={formData.year.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, year: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="self_assessment">Penilaian Diri</Label>
                  <Textarea
                    id="self_assessment"
                    value={formData.self_assessment}
                    onChange={(e) => setFormData(prev => ({ ...prev, self_assessment: e.target.value }))}
                    placeholder="Berikan penilaian terhadap kinerja Anda pada periode ini..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="achievements">Pencapaian & Prestasi</Label>
                  <Textarea
                    id="achievements"
                    value={formData.achievements}
                    onChange={(e) => setFormData(prev => ({ ...prev, achievements: e.target.value }))}
                    placeholder="Sebutkan pencapaian dan prestasi yang telah diraih..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenges">Kendala & Tantangan</Label>
                  <Textarea
                    id="challenges"
                    value={formData.challenges}
                    onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
                    placeholder="Jelaskan kendala dan tantangan yang dihadapi..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="improvement_plan">Rencana Perbaikan</Label>
                  <Textarea
                    id="improvement_plan"
                    value={formData.improvement_plan}
                    onChange={(e) => setFormData(prev => ({ ...prev, improvement_plan: e.target.value }))}
                    placeholder="Jelaskan rencana perbaikan untuk periode selanjutnya..."
                    rows={4}
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    Buat Laporan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Laporan</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <ClipboardCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disetujui</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === "approved").length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Menunggu</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === "submitted").length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === "draft").length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan Kinerja {selectedYear}</CardTitle>
          <CardDescription>
            Kelola laporan kinerja bulanan dan pantau status approval
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
                    <TableHead>Periode</TableHead>
                    <TableHead>Kehadiran</TableHead>
                    <TableHead>Progress SKP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Submit</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Belum ada laporan kinerja. Klik "Buat Laporan" untuk memulai.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(report.status)}
                            {report.period}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {report.attendance_summary.attendance_percentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {report.attendance_summary.present_days}/{report.attendance_summary.total_days} hari
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {report.skp_summary.average_progress.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {report.skp_summary.completed_items}/{report.skp_summary.total_items} item
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(report.status)}
                        </TableCell>
                        <TableCell>
                          {report.submitted_at ? (
                            <div className="text-sm">
                              {new Date(report.submitted_at).toLocaleDateString('id-ID')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingReport(report)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {report.status === "draft" && (
                              <Button
                                size="sm"
                                onClick={() => handleSubmitReport(report.id)}
                              >
                                <Send className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />
                  Laporan Kinerja - {viewingReport.period}
                </DialogTitle>
                <DialogDescription>
                  Detail laporan kinerja dan data pendukung
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status and Approval Info */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">Status: {getStatusBadge(viewingReport.status)}</p>
                      {viewingReport.submitted_at && (
                        <p className="text-sm text-muted-foreground">
                          Disubmit: {new Date(viewingReport.submitted_at).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                  {viewingReport.approver_name && (
                    <div className="text-right">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {viewingReport.approver_name}
                      </p>
                      {viewingReport.approved_at && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(viewingReport.approved_at).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Tabs defaultValue="summary" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="summary">Ringkasan</TabsTrigger>
                    <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
                    <TabsTrigger value="skp">SKP</TabsTrigger>
                    <TabsTrigger value="assessment">Penilaian</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Ringkasan Kehadiran</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span>Persentase Kehadiran</span>
                            <Badge variant="outline">
                              {viewingReport.attendance_summary.attendance_percentage.toFixed(1)}%
                            </Badge>
                          </div>
                          <Progress value={viewingReport.attendance_summary.attendance_percentage} />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Hadir</p>
                              <p className="font-medium">{viewingReport.attendance_summary.present_days} hari</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Terlambat</p>
                              <p className="font-medium">{viewingReport.attendance_summary.late_days} hari</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Ringkasan SKP</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span>Progress Rata-rata</span>
                            <Badge variant="outline">
                              {viewingReport.skp_summary.average_progress.toFixed(1)}%
                            </Badge>
                          </div>
                          <Progress value={viewingReport.skp_summary.average_progress} />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Selesai</p>
                              <p className="font-medium">{viewingReport.skp_summary.completed_items} item</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-medium">{viewingReport.skp_summary.total_items} item</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="attendance" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Detail Kehadiran</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                          <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">
                              {viewingReport.attendance_summary.total_days}
                            </p>
                            <p className="text-sm text-muted-foreground">Total Hari Kerja</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold text-green-600">
                              {viewingReport.attendance_summary.present_days}
                            </p>
                            <p className="text-sm text-muted-foreground">Hari Hadir</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold text-yellow-600">
                              {viewingReport.attendance_summary.late_days}
                            </p>
                            <p className="text-sm text-muted-foreground">Hari Terlambat</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <p className="text-2xl font-bold text-red-600">
                              {viewingReport.attendance_summary.absent_days}
                            </p>
                            <p className="text-sm text-muted-foreground">Hari Tidak Hadir</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="skp" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Detail SKP</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="text-center p-4 border rounded-lg">
                              <p className="text-2xl font-bold text-blue-600">
                                {viewingReport.skp_summary.total_items}
                              </p>
                              <p className="text-sm text-muted-foreground">Total Item SKP</p>
                            </div>
                            <div className="text-center p-4 border rounded-lg">
                              <p className="text-2xl font-bold text-green-600">
                                {viewingReport.skp_summary.completed_items}
                              </p>
                              <p className="text-sm text-muted-foreground">Item Selesai</p>
                            </div>
                            <div className="text-center p-4 border rounded-lg">
                              <p className="text-2xl font-bold text-purple-600">
                                {viewingReport.skp_summary.average_progress.toFixed(1)}%
                              </p>
                              <p className="text-sm text-muted-foreground">Progress Rata-rata</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">Progress Keseluruhan</p>
                            <Progress value={viewingReport.skp_summary.average_progress} className="h-3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="assessment" className="space-y-4">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Penilaian Diri</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed">{viewingReport.self_assessment}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Pencapaian & Prestasi</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-sm leading-relaxed whitespace-pre-wrap">{viewingReport.achievements}</pre>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Kendala & Tantangan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-sm leading-relaxed whitespace-pre-wrap">{viewingReport.challenges}</pre>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Rencana Perbaikan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-sm leading-relaxed whitespace-pre-wrap">{viewingReport.improvement_plan}</pre>
                        </CardContent>
                      </Card>

                      {viewingReport.feedback && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Feedback Supervisor</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800">{viewingReport.feedback}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewingReport(null)}>
                  Tutup
                </Button>
                {viewingReport.status === "draft" && (
                  <Button onClick={() => {
                    handleSubmitReport(viewingReport.id)
                    setViewingReport(null)
                  }}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit untuk Approval
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}