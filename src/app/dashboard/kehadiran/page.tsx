"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, Filter, Search, UserCheck, Clock, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface AttendanceDetail {
  id: string
  date: string
  employee: {
    name: string
    nip: string
    unit: string
  }
  checkIn: string | null
  checkOut: string | null
  workHours: string
  status: string
  location: string
  overtime: string
}

export default function KehadiranPage() {
  const { data: session } = useSession()
  const [attendanceData, setAttendanceData] = useState<AttendanceDetail[]>([])
  const [filteredData, setFilteredData] = useState<AttendanceDetail[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({})
  const [isLoading, setIsLoading] = useState(true)

  // Mock data
  useEffect(() => {
    const mockData: AttendanceDetail[] = [
      {
        id: "1",
        date: "2024-12-21",
        employee: {
          name: "Ahmad Sudrajat",
          nip: "199001012020121001",
          unit: "Bagian Umum"
        },
        checkIn: "08:00:00",
        checkOut: "17:00:00",
        workHours: "8j 0m",
        status: "hadir",
        location: "Kantor Pusat",
        overtime: "0j 0m"
      },
      {
        id: "2",
        date: "2024-12-21",
        employee: {
          name: "Siti Nurhaliza",
          nip: "199002022021121002",
          unit: "Bagian Keuangan"
        },
        checkIn: "08:15:00",
        checkOut: "17:30:00",
        workHours: "8j 15m",
        status: "terlambat",
        location: "Kantor Pusat",
        overtime: "0j 30m"
      },
      {
        id: "3",
        date: "2024-12-21",
        employee: {
          name: "Budi Santoso",
          nip: "199003032022121003",
          unit: "Bagian IT"
        },
        checkIn: null,
        checkOut: null,
        workHours: "0j 0m",
        status: "alpha",
        location: "-",
        overtime: "0j 0m"
      },
      {
        id: "4",
        date: "2024-12-20",
        employee: {
          name: "Dewi Sartika",
          nip: "199004042023121004",
          unit: "Bagian Kepegawaian"
        },
        checkIn: "07:45:00",
        checkOut: "16:45:00",
        workHours: "8j 0m",
        status: "hadir",
        location: "Kantor Pusat",
        overtime: "0j 0m"
      },
      {
        id: "5",
        date: "2024-12-20",
        employee: {
          name: "Eko Prasetyo",
          nip: "199005052024121005",
          unit: "Bagian Hukum"
        },
        checkIn: "08:30:00",
        checkOut: "18:00:00",
        workHours: "8j 30m",
        status: "terlambat",
        location: "Kantor Cabang",
        overtime: "1j 0m"
      }
    ]

    setTimeout(() => {
      setAttendanceData(mockData)
      setFilteredData(mockData)
      setIsLoading(false)
    }, 1000)
  }, [])

  // Filter data
  useEffect(() => {
    let filtered = attendanceData

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee.nip.includes(searchTerm) ||
        item.employee.unit.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date)
        const fromDate = dateRange.from!
        const toDate = dateRange.to || dateRange.from!
        return itemDate >= fromDate && itemDate <= toDate
      })
    }

    setFilteredData(filtered)
  }, [attendanceData, searchTerm, statusFilter, dateRange])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hadir':
        return <Badge className="bg-green-100 text-green-800">Hadir</Badge>
      case 'terlambat':
        return <Badge className="bg-yellow-100 text-yellow-800">Terlambat</Badge>
      case 'alpha':
        return <Badge className="bg-red-100 text-red-800">Alpha</Badge>
      case 'izin':
        return <Badge className="bg-blue-100 text-blue-800">Izin</Badge>
      case 'sakit':
        return <Badge className="bg-purple-100 text-purple-800">Sakit</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const exportToCSV = () => {
    const headers = ["Tanggal", "Nama", "NIP", "Unit", "Masuk", "Keluar", "Jam Kerja", "Status", "Lokasi", "Lembur"]
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => [
        row.date,
        row.employee.name,
        row.employee.nip,
        row.employee.unit,
        row.checkIn || "-",
        row.checkOut || "-",
        row.workHours,
        row.status,
        row.location,
        row.overtime
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `kehadiran-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Statistics
  const totalEmployees = filteredData.length
  const presentEmployees = filteredData.filter(item => item.status === 'hadir').length
  const lateEmployees = filteredData.filter(item => item.status === 'terlambat').length
  const absentEmployees = filteredData.filter(item => item.status === 'alpha').length
  const attendanceRate = totalEmployees > 0 ? ((presentEmployees + lateEmployees) / totalEmployees * 100).toFixed(1) : "0"

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kehadiran</h1>
          <p className="text-muted-foreground">Monitoring detail kehadiran pegawai</p>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pegawai</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hadir</p>
                <p className="text-2xl font-bold text-green-600">{presentEmployees}</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terlambat</p>
                <p className="text-2xl font-bold text-yellow-600">{lateEmployees}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tingkat Kehadiran</p>
                <p className="text-2xl font-bold text-blue-600">{attendanceRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nama, NIP, atau Unit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="hadir">Hadir</SelectItem>
                  <SelectItem value="terlambat">Terlambat</SelectItem>
                  <SelectItem value="alpha">Alpha</SelectItem>
                  <SelectItem value="izin">Izin</SelectItem>
                  <SelectItem value="sakit">Sakit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Mulai</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Akhir</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setDateRange({})
              }}
            >
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Kehadiran</CardTitle>
          <CardDescription>
            Menampilkan {filteredData.length} dari {attendanceData.length} data kehadiran
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
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pegawai</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Masuk</TableHead>
                    <TableHead>Keluar</TableHead>
                    <TableHead>Jam Kerja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Lembur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Tidak ada data kehadiran yang ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {format(new Date(item.date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.employee.name}</p>
                            <p className="text-sm text-muted-foreground">{item.employee.nip}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.employee.unit}</TableCell>
                        <TableCell>{item.checkIn || "-"}</TableCell>
                        <TableCell>{item.checkOut || "-"}</TableCell>
                        <TableCell>{item.workHours}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{item.overtime}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}