"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, User, FileText, GraduationCap } from "lucide-react"
import { PersonalDataTab } from "@/components/profile/personal-data-tab"
import { SkHistoryTab } from "@/components/profile/sk-history-tab"
import { TrainingTab } from "@/components/profile/training-tab"

interface ProfileData {
  id?: string;
  user_id?: string;
  full_name?: string;
  birth_place?: string;
  birth_date?: string;
  gender?: string;
  religion?: string;
  marital_status?: string;
  address?: string;
  phone?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  photo_url?: string;
  education_level?: string;
  education_institution?: string;
  education_major?: string;
  education_year?: number;
  employment_start_date?: string;
  years_of_service?: number;
  skills?: string[];
  user?: {
    nip: string;
    name: string;
    email: string;
    position?: string;
    work_unit?: string;
    grade?: string;
    employment_status?: string;
  };
  sk_history?: any[];
  training_records?: any[];
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [activeTab, setActiveTab] = useState("personal")

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
      } else {
        toast.error('Gagal memuat data profil')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Terjadi kesalahan saat memuat profil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = (updatedData: Partial<ProfileData>) => {
    setProfileData(prev => prev ? { ...prev, ...updatedData } : null)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat data profil...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profil ASN</h1>
          <p className="text-muted-foreground">Kelola informasi profil dan data kepegawaian Anda</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Data Diri</span>
            <span className="sm:hidden">Pribadi</span>
          </TabsTrigger>
          <TabsTrigger value="sk" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">SK Jabatan</span>
            <span className="sm:hidden">SK</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Pelatihan</span>
            <span className="sm:hidden">Training</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Data Tab */}
        <TabsContent value="personal" className="space-y-6">
          <PersonalDataTab 
            profileData={profileData} 
            onUpdate={handleProfileUpdate}
          />
        </TabsContent>

        {/* SK History Tab */}
        <TabsContent value="sk" className="space-y-6">
          <SkHistoryTab 
            profileData={profileData}
            onUpdate={handleProfileUpdate}
          />
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <TrainingTab 
            profileData={profileData}
            onUpdate={handleProfileUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}