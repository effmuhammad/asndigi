"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Home, Clock, ClipboardCheck, Users, UserCog } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  // Menu items untuk shortcut buttons
  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Presensi",
      url: "/dashboard/absensi",
      icon: Clock,
    },
    {
      title: "Sasaran Kinerja Pegawai",
      url: "/dashboard/skp-bulanan",
      icon: Calendar,
    },
    {
      title: "Laporan Akhir Kinerja",
      url: "/dashboard/laporan-kinerja",
      icon: ClipboardCheck,
    },
    {
      title: "Profil ASN",
      url: "/dashboard/profile",
      icon: Users,
    },
  ]

  // Menu items khusus untuk Admin
  const adminItems = [
    {
      title: "Manajemen Pengguna",
      url: "/dashboard/admin/users",
      icon: UserCog,
    },
  ]

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center w-full">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard PRIMA ASN
          </h1>
          <p className="text-gray-600">
            Selamat datang, {session.user.name}
          </p>
        </div>
        <Button 
          onClick={() => signOut({ callbackUrl: "/" })}
          variant="outline"
        >
          Keluar
        </Button>
      </div>

      {/* Menu Shortcuts */}
      <div className="w-full">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Utama</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {menuItems.map((item) => (
            <Button
              key={item.title}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 text-center p-4"
              onClick={() => router.push(item.url)}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.title}</span>
            </Button>
          ))}
        </div>
        
        {/* Admin Menu Shortcuts - hanya terlihat untuk role admin */}
        {session?.user?.role === 'ADMIN' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Menu Admin</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {adminItems.map((item) => (
                <Button
                  key={item.title}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 text-center p-4"
                  onClick={() => router.push(item.url)}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.title}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>
            Aktivitas terbaru dalam sistem PRIMA ASN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Dokumen baru ditambahkan</p>
                <p className="text-xs text-muted-foreground">2 menit yang lalu</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Laporan disetujui</p>
                <p className="text-xs text-muted-foreground">15 menit yang lalu</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Profil ASN diperbarui</p>
                <p className="text-xs text-muted-foreground">1 jam yang lalu</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}