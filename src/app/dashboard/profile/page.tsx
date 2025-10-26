"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { profileSchema, type ProfileFormData } from "@/lib/validations/profile"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Award, 
  FileText, 
  Upload,
  Edit,
  Save,
  X,
  Loader2
} from "lucide-react"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    // Personal Information
    fullName: "Dr. Ahmad Wijaya, S.Kom., M.T.",
    nip: "198501012010011001",
    email: "ahmad.wijaya@kemendagri.go.id",
    position: "Analis Sistem Informasi Ahli Madya",
    unitKerja: "Direktorat Jenderal Kependudukan dan Pencatatan Sipil",
    grade: "III/d",
    profilePhoto: "/placeholder-avatar.jpg",
    
    // Professional Details
    employmentStartDate: "2010-01-01",
    yearsOfService: "14 tahun",
    education: [
      { degree: "S3 Teknik Informatika", institution: "Institut Teknologi Bandung", year: "2018" },
      { degree: "S2 Teknik Informatika", institution: "Universitas Gadjah Mada", year: "2012" },
      { degree: "S1 Sistem Informasi", institution: "Universitas Indonesia", year: "2008" }
    ],
    certifications: [
      { name: "Certified Information Systems Auditor (CISA)", issuer: "ISACA", year: "2020" },
      { name: "Project Management Professional (PMP)", issuer: "PMI", year: "2019" },
      { name: "Certified Ethical Hacker (CEH)", issuer: "EC-Council", year: "2018" }
    ],
    skills: ["Analisis Sistem", "Manajemen Proyek", "Keamanan Siber", "Database Management", "Python", "Java"],
    
    // Contact Information
    phone: "+6281234567890",
    address: "Jl. Merdeka No. 123, Jakarta Pusat 10110",
    emergencyContactName: "Siti Wijaya",
    emergencyContactRelationship: "Istri",
    emergencyContactPhone: "+6281398765432",
    
    // Performance Summary
    currentSKP: "Sangat Baik (91.5)",
    performanceRating: "Sangat Baik",
    achievements: [
      "Penghargaan Pegawai Teladan 2023",
      "Implementasi Sistem Digital Terpadu",
      "Sertifikasi ISO 27001 Lead Auditor"
    ]
  })

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profileData.fullName,
      nip: profileData.nip,
      email: profileData.email,
      position: profileData.position,
      unitKerja: profileData.unitKerja,
      grade: profileData.grade,
      employmentStartDate: profileData.employmentStartDate,
      phone: profileData.phone,
      address: profileData.address,
      emergencyContactName: profileData.emergencyContactName,
      emergencyContactRelationship: profileData.emergencyContactRelationship,
      emergencyContactPhone: profileData.emergencyContactPhone,
    }
  })

  const handleSave = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      // TODO: Implement API call to save profile data
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        ...data
      }))
      
      setIsEditing(false)
      toast.success("Profil berhasil disimpan!")
    } catch (error) {
      toast.error("Gagal menyimpan profil. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    form.reset()
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profil ASN</h1>
          <p className="text-muted-foreground">Kelola informasi profil dan data kepegawaian Anda</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button 
                onClick={form.handleSubmit(handleSave)} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Simpan
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profil
            </Button>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)}>
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="personal" className="text-xs md:text-sm">Pribadi</TabsTrigger>
              <TabsTrigger value="professional" className="text-xs md:text-sm">Profesional</TabsTrigger>
              <TabsTrigger value="contact" className="text-xs md:text-sm">Kontak</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs md:text-sm">Kinerja</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs md:text-sm">Dokumen</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informasi Pribadi
                  </CardTitle>
                  <CardDescription>
                    Data pribadi dan kepegawaian ASN
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Photo */}
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profileData.profilePhoto} alt="Profile" />
                      <AvatarFallback className="text-lg">
                        {profileData.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="space-y-2 text-center sm:text-left">
                        <Button variant="outline" size="sm" type="button">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Foto
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Format: JPG, PNG. Maksimal 2MB
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIP</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jabatan</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unitKerja"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Unit Kerja</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Golongan/Ruang</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professional Details Tab */}
            <TabsContent value="professional" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Employment Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Informasi Kepegawaian
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="employmentStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal Mulai Bekerja</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Label>Masa Kerja</Label>
                      <Input
                        value={profileData.yearsOfService}
                        disabled={true}
                        className="bg-muted"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle>Keahlian &amp; Kompetensi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <Button variant="outline" size="sm" className="mt-4" type="button">
                        Tambah Keahlian
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Education */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Riwayat Pendidikan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profileData.education.map((edu, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-2">
                        <div>
                          <h4 className="font-semibold">{edu.degree}</h4>
                          <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        </div>
                        <Badge variant="outline">{edu.year}</Badge>
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <Button variant="outline" className="mt-4" type="button">
                      Tambah Pendidikan
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Sertifikasi &amp; Pelatihan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profileData.certifications.map((cert, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-2">
                        <div>
                          <h4 className="font-semibold">{cert.name}</h4>
                          <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                        </div>
                        <Badge variant="outline">{cert.year}</Badge>
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <Button variant="outline" className="mt-4" type="button">
                      Tambah Sertifikasi
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Information Tab */}
            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Informasi Kontak
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Telepon</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Alamat</FormLabel>
                          <FormControl>
                            <Textarea {...field} disabled={!isEditing} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Kontak Darurat</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="emergencyContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!isEditing} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="emergencyContactRelationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hubungan</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!isEditing} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="emergencyContactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nomor Telepon</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!isEditing} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Summary Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Status SKP Terkini</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-3xl font-bold text-blue-600">{profileData.currentSKP}</div>
                      <Badge className="bg-green-100 text-green-800">{profileData.performanceRating}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Prestasi &amp; Penghargaan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profileData.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Manajemen Dokumen
                  </CardTitle>
                  <CardDescription>
                    Upload dan kelola dokumen pribadi Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload Dokumen</h3>
                    <p className="text-muted-foreground mb-4">
                      Drag &amp; drop file atau klik untuk memilih
                    </p>
                    <Button variant="outline" type="button">
                      Pilih File
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Format: PDF, DOC, DOCX. Maksimal 10MB per file
                    </p>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">Dokumen Tersimpan</h4>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium">CV_Ahmad_Wijaya.pdf</p>
                            <p className="text-sm text-muted-foreground">Uploaded 2 hari yang lalu</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" type="button">
                          Download
                        </Button>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Sertifikat_CISA.pdf</p>
                            <p className="text-sm text-muted-foreground">Uploaded 1 minggu yang lalu</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" type="button">
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  )
}