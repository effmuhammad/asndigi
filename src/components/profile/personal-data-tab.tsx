"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileUpload } from "@/components/ui/file-upload"
import { User, Edit, Save, X, Camera } from "lucide-react"
import { profileSchema, type ProfileFormData, GENDER_OPTIONS, RELIGION_OPTIONS, MARITAL_STATUS_OPTIONS, EDUCATION_LEVEL_OPTIONS } from "@/lib/validations/profile"

interface PersonalDataTabProps {
  profileData: any
  onUpdate: (data: any) => void
}

export function PersonalDataTab({ profileData, onUpdate }: PersonalDataTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profileData?.full_name || profileData?.user?.name || "",
      birth_place: profileData?.birth_place || "",
      birth_date: profileData?.birth_date || "",
      gender: profileData?.gender || "",
      religion: profileData?.religion || "",
      marital_status: profileData?.marital_status || "",
      address: profileData?.address || "",
      phone: profileData?.phone || "",
      emergency_contact: profileData?.emergency_contact || "",
      emergency_phone: profileData?.emergency_phone || "",
      education_level: profileData?.education_level || "",
      education_institution: profileData?.education_institution || "",
      education_major: profileData?.education_major || "",
      education_year: profileData?.education_year || new Date().getFullYear(),
      employment_start_date: profileData?.employment_start_date || "",
    }
  })

  const handleEdit = () => {
    setIsEditing(true)
    // Reset form with current data
    form.reset({
      full_name: profileData?.full_name || profileData?.user?.name || "",
      birth_place: profileData?.birth_place || "",
      birth_date: profileData?.birth_date || "",
      gender: profileData?.gender || "",
      religion: profileData?.religion || "",
      marital_status: profileData?.marital_status || "",
      address: profileData?.address || "",
      phone: profileData?.phone || "",
      emergency_contact: profileData?.emergency_contact || "",
      emergency_phone: profileData?.emergency_phone || "",
      education_level: profileData?.education_level || "",
      education_institution: profileData?.education_institution || "",
      education_major: profileData?.education_major || "",
      education_year: profileData?.education_year || new Date().getFullYear(),
      employment_start_date: profileData?.employment_start_date || "",
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setPhotoFile(null)
    form.reset()
  }

  const handlePhotoUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'profile')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        return result.url
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Gagal mengupload foto')
      return null
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true)

      let photoUrl = profileData?.photo_url
      if (photoFile) {
        photoUrl = await handlePhotoUpload(photoFile)
        if (!photoUrl) return
      }

      const submitData = {
        ...data,
        photo_url: photoUrl,
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        onUpdate(updatedProfile)
        setIsEditing(false)
        setPhotoFile(null)
        toast.success('Profil berhasil diperbarui')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Gagal memperbarui profil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Terjadi kesalahan saat memperbarui profil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Data Pribadi
            </CardTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button type="button" variant="outline" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={photoFile ? URL.createObjectURL(photoFile) : profileData?.photo_url} 
                  alt="Profile photo" 
                />
                <AvatarFallback>
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="text-center">
                  <FileUpload
                    accept="image/*"
                    maxSize={2 * 1024 * 1024} // 2MB
                    onFileSelect={(files) => setPhotoFile(files[0])}
                    className="w-full max-w-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Ubah Foto
                    </div>
                  </FileUpload>
                  <p className="text-xs text-muted-foreground mt-2">
                    Format: JPG, PNG. Maksimal 2MB
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="full_name"
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

              <div className="space-y-2">
                <label className="text-sm font-medium">NIP</label>
                <Input 
                  value={profileData?.user?.nip || ""} 
                  disabled 
                  className="bg-muted"
                />
              </div>

              <FormField
                control={form.control}
                name="birth_place"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempat Lahir</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Lahir</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis kelamin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="religion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agama</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih agama" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RELIGION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marital_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Pernikahan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status pernikahan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MARITAL_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Kontak Darurat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="emergency_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Kontak Darurat</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergency_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon Darurat</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Education */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Pendidikan Terakhir</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="education_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tingkat Pendidikan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tingkat pendidikan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EDUCATION_LEVEL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="education_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tahun Lulus</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1950" 
                          max={new Date().getFullYear()}
                          disabled={!isEditing} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="education_institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institusi/Universitas</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="education_major"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jurusan/Program Studi</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employment_start_date"
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
                  <label className="text-sm font-medium">Masa Kerja</label>
                  <Input 
                    value={profileData?.years_of_service ? `${profileData.years_of_service} tahun` : ""} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}