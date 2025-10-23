"use client"

import { Calendar, Home, Inbox, Search, Settings, Users, FileText, BarChart3, Clock, UserCheck, Target, ClipboardCheck } from "lucide-react"
import { useSession } from "next-auth/react"

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

// Menu items untuk ASN Digital
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Absensi",
    url: "/dashboard/absensi",
    icon: Clock,
  },
  {
    title: "Kehadiran",
    url: "/dashboard/kehadiran",
    icon: UserCheck,
  },
  {
    title: "SKP",
    url: "/dashboard/skp",
    icon: Target,
  },
  {
    title: "Laporan Kinerja",
    url: "/dashboard/laporan-kinerja",
    icon: ClipboardCheck,
  },
  {
    title: "Profil ASN",
    url: "/dashboard/profile",
    icon: Users,
  },
  {
    title: "Pengaturan",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { data: session } = useSession()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">ASN Digital</span>
            <span className="truncate text-xs">Sistem Informasi ASN</span>
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
                  <SidebarMenuButton asChild>
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