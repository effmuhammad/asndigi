import { z } from 'zod';

// Profile validation schema
export const profileSchema = z.object({
  full_name: z.string().optional(),
  birth_place: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['Laki-laki', 'Perempuan']).optional(),
  religion: z.enum(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']).optional(),
  marital_status: z.enum(['Belum Menikah', 'Menikah', 'Cerai Hidup', 'Cerai Mati']).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  photo_url: z.string().optional(),
  education_level: z.enum(['SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3']).optional(),
  education_institution: z.string().optional(),
  education_major: z.string().optional(),
  education_year: z.number().min(1950).max(new Date().getFullYear()).optional(),
  employment_start_date: z.string().optional(),
  years_of_service: z.number().min(0).optional(),
  skills: z.array(z.string()).optional(),
});

// SK History validation schema
export const skHistorySchema = z.object({
  sk_number: z.string().min(1, 'Nomor SK wajib diisi'),
  sk_type: z.enum(['PENGANGKATAN', 'MUTASI', 'PROMOSI', 'PEMBERHENTIAN'], {
    errorMap: () => ({ message: 'Jenis SK tidak valid' })
  }),
  position: z.string().min(1, 'Jabatan wajib diisi'),
  unit: z.string().min(1, 'Unit kerja wajib diisi'),
  effective_date: z.string().min(1, 'Tanggal efektif wajib diisi'),
  file_url: z.string().optional(),
  description: z.string().optional(),
});

// Training Record validation schema
export const trainingRecordSchema = z.object({
  training_name: z.string().min(1, 'Nama pelatihan wajib diisi'),
  category: z.enum(['TEKNIS', 'MANAJERIAL', 'SOSIAL_KULTURAL', 'FUNGSIONAL', 'KEPEMIMPINAN'], {
    errorMap: () => ({ message: 'Kategori pelatihan tidak valid' })
  }),
  organizer: z.string().min(1, 'Penyelenggara wajib diisi'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
  duration_hours: z.number().min(1, 'Durasi minimal 1 jam').optional(),
  certificate_url: z.string().optional(),
  description: z.string().optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: 'Tanggal selesai harus setelah tanggal mulai',
  path: ['end_date'],
});

// File upload validation schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File wajib dipilih' }),
  type: z.enum(['photo', 'sk', 'certificate'], {
    errorMap: () => ({ message: 'Tipe file tidak valid' })
  }),
}).refine((data) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return data.file.size <= maxSize;
}, {
  message: 'Ukuran file maksimal 5MB',
  path: ['file'],
}).refine((data) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  return allowedTypes.includes(data.file.type);
}, {
  message: 'Tipe file harus JPEG, PNG, WebP, atau PDF',
  path: ['file'],
});

// Type definitions
export type ProfileFormData = z.infer<typeof profileSchema>;
export type SkHistoryFormData = z.infer<typeof skHistorySchema>;
export type TrainingRecordFormData = z.infer<typeof trainingRecordSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;

// Constants for form options
export const GENDER_OPTIONS = [
  { value: 'Laki-laki', label: 'Laki-laki' },
  { value: 'Perempuan', label: 'Perempuan' },
];

export const RELIGION_OPTIONS = [
  { value: 'Islam', label: 'Islam' },
  { value: 'Kristen', label: 'Kristen' },
  { value: 'Katolik', label: 'Katolik' },
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Buddha', label: 'Buddha' },
  { value: 'Konghucu', label: 'Konghucu' },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: 'Belum Menikah', label: 'Belum Menikah' },
  { value: 'Menikah', label: 'Menikah' },
  { value: 'Cerai Hidup', label: 'Cerai Hidup' },
  { value: 'Cerai Mati', label: 'Cerai Mati' },
];

export const EDUCATION_LEVEL_OPTIONS = [
  { value: 'SD', label: 'SD' },
  { value: 'SMP', label: 'SMP' },
  { value: 'SMA', label: 'SMA' },
  { value: 'D1', label: 'D1' },
  { value: 'D2', label: 'D2' },
  { value: 'D3', label: 'D3' },
  { value: 'D4', label: 'D4' },
  { value: 'S1', label: 'S1' },
  { value: 'S2', label: 'S2' },
  { value: 'S3', label: 'S3' },
];

export const SK_TYPE_OPTIONS = [
  { value: 'PENGANGKATAN', label: 'Pengangkatan' },
  { value: 'MUTASI', label: 'Mutasi' },
  { value: 'PROMOSI', label: 'Promosi' },
  { value: 'PEMBERHENTIAN', label: 'Pemberhentian' },
];

export const TRAINING_CATEGORY_OPTIONS = [
  { value: 'TEKNIS', label: 'Teknis' },
  { value: 'MANAJERIAL', label: 'Manajerial' },
  { value: 'SOSIAL_KULTURAL', label: 'Sosial Kultural' },
  { value: 'FUNGSIONAL', label: 'Fungsional' },
  { value: 'KEPEMIMPINAN', label: 'Kepemimpinan' },
];