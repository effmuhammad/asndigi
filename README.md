# PRIMA ASN
**Performance Review and Intelligent Merit Assessment untuk Aparatur Sipil Negara**

## Deskripsi Aplikasi

**English Description:** AI-BASED PERFORMANCE EVALUATION SYSTEM FOR ASN

**Deskripsi Indonesia:** SISTEM EVALUASI KINERJA ASN BERBASIS AI

Pengembangan aplikasi PRIMA ASN (Performance Review and Intelligent Merit Assessment) bertujuan untuk menciptakan sistem penilaian kinerja ASN yang modern, objektif, dan berbasis teknologi kecerdasan buatan (AI) guna mendukung implementasi sistem merit secara nasional.

## Fitur Utama

- 🤖 **Evaluasi Berbasis AI**: Sistem penilaian kinerja yang objektif menggunakan teknologi kecerdasan buatan
- 📊 **Dashboard Analytics**: Visualisasi data kinerja yang komprehensif
- 🔐 **Sistem Keamanan**: Autentikasi dan otorisasi yang aman untuk data ASN
- 📱 **Responsive Design**: Dapat diakses melalui berbagai perangkat
- 🏛️ **Standar Pemerintah**: Mengikuti standar dan regulasi pemerintah Indonesia

## Memulai Pengembangan

Proyek ini dibangun menggunakan [Next.js](https://nextjs.org) dengan [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Instalasi

```bash
npm install
```

### Menjalankan Server Development

```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
# atau
bun dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat aplikasi.

### Struktur Proyek

- `src/app/` - Halaman dan routing aplikasi
- `src/components/` - Komponen UI yang dapat digunakan kembali
- `src/lib/` - Utilitas dan konfigurasi
- `prisma/` - Database schema dan migrasi
- `public/` - Asset statis termasuk logo aplikasi

## Teknologi yang Digunakan

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: Shadcn/ui

## Deploy

Aplikasi dapat di-deploy menggunakan [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Lihat [dokumentasi deployment Next.js](https://nextjs.org/docs/app/building-your-application/deploying) untuk detail lebih lanjut.

## Referensi

- [Building a Face Recognition Attendance System with Next.js, TypeScript, Face-API.js, and Supabase](https://dev.to/ferryops/building-a-face-recognition-attendance-system-with-nextjs-typescript-face-apijs-and-supabase-41jp)