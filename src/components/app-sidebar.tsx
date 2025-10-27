"use client"

import { Calendar, Home, Inbox, Search, Settings, Users, FileText, BarChart3, Clock, Target, ClipboardCheck, UserCog, Building2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"

// Menu items untuk PRIMA ASN
const items = [
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
  // {
  //   title: "Laporan Organisasi",
  //   url: "/dashboard/laporan-organisasi",
  //   icon: Building2,
  // },
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

export function AppSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-blue-500">
            <img src="/logo.png" alt="PRIMA ASN" className="w-6" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-blue-500">PRIMA ASN</span>
            <span className="truncate text-[10px]">Sistem Evaluasi Kinerja ASN</span>
            <span className="truncate text-[10px]">Berbasis AI</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={pathname === item.url}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Section Admin - hanya terlihat untuk role admin */}
        {session?.user?.role === 'ADMIN' && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={pathname === item.url}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        {session?.user && (
          <NavUser
            user={{
              name: session.user.name || "User",
              email: session.user.email || "user@example.com",
              avatar: undefined,
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}