import { z } from "zod"

export const profileSchema = z.object({
  // Personal Information
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").max(100, "Nama lengkap maksimal 100 karakter"),
  nip: z.string().regex(/^\d{18}$/, "NIP harus terdiri dari 18 digit angka"),
  email: z.string().email("Format email tidak valid"),
  position: z.string().min(2, "Jabatan minimal 2 karakter").max(100, "Jabatan maksimal 100 karakter"),
  unitKerja: z.string().min(2, "Unit kerja minimal 2 karakter").max(200, "Unit kerja maksimal 200 karakter"),
  grade: z.string().min(1, "Golongan/ruang wajib diisi"),
  
  // Professional Details
  employmentStartDate: z.string().min(1, "Tanggal mulai bekerja wajib diisi"),
  
  // Contact Information
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,13}$/, "Format nomor telepon tidak valid"),
  address: z.string().min(10, "Alamat minimal 10 karakter").max(500, "Alamat maksimal 500 karakter"),
  
  // Emergency Contact
  emergencyContactName: z.string().min(2, "Nama kontak darurat minimal 2 karakter"),
  emergencyContactRelationship: z.string().min(2, "Hubungan kontak darurat wajib diisi"),
  emergencyContactPhone: z.string().regex(/^(\+62|62|0)[0-9]{9,13}$/, "Format nomor telepon kontak darurat tidak valid"),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// Validation for individual sections
export const personalInfoSchema = profileSchema.pick({
  fullName: true,
  nip: true,
  email: true,
  position: true,
  unitKerja: true,
  grade: true,
})

export const contactInfoSchema = profileSchema.pick({
  phone: true,
  address: true,
  emergencyContactName: true,
  emergencyContactRelationship: true,
  emergencyContactPhone: true,
})

export const professionalInfoSchema = profileSchema.pick({
  employmentStartDate: true,
})