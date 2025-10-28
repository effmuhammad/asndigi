import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AnnualPerformanceData {
  employeeName: string
  year: number
  attendanceSummary: {
    total_days: number
    present_days: number
    late_days: number
    absent_days: number
    attendance_percentage: number
  }
  skpSummary: {
    total_items: number
    approved_items: number
    completion_percentage: number
    by_status: {
      DRAFT: number
      SUBMITTED: number
      APPROVED: number
      REJECTED: number
    }
  }
  workResultRating: string
  behaviorRating: string
  performancePredicate: string
  selfAssessment?: string
  achievements?: string
  challenges?: string
  improvementPlan?: string
}

export async function generateAnnualPerformanceSummary(data: AnnualPerformanceData): Promise<string> {
  try {
    const prompt = `
Sebagai sistem evaluasi kinerja ASN, buatlah ringkasan kinerja tahunan yang komprehensif berdasarkan data berikut:

INFORMASI PEGAWAI:
- Nama: ${data.employeeName}
- Tahun Evaluasi: ${data.year}

DATA KEHADIRAN:
- Total Hari Kerja: ${data.attendanceSummary.total_days} hari
- Hari Hadir: ${data.attendanceSummary.present_days} hari
- Hari Terlambat: ${data.attendanceSummary.late_days} hari
- Hari Tidak Hadir: ${data.attendanceSummary.absent_days} hari
- Persentase Kehadiran: ${data.attendanceSummary.attendance_percentage}%

DATA SKP (Sasaran Kinerja Pegawai):
- Total Item SKP: ${data.skpSummary.total_items}
- Item yang Disetujui: ${data.skpSummary.approved_items}
- Persentase Penyelesaian: ${data.skpSummary.completion_percentage}%
- Status Detail:
  * Draft: ${data.skpSummary.by_status.DRAFT}
  * Submitted: ${data.skpSummary.by_status.SUBMITTED}
  * Approved: ${data.skpSummary.by_status.APPROVED}
  * Rejected: ${data.skpSummary.by_status.REJECTED}

PENILAIAN KINERJA:
- Rating Hasil Kerja: ${data.workResultRating}
- Rating Perilaku Kerja: ${data.behaviorRating}
- Predikat Kinerja: ${data.performancePredicate}

${data.selfAssessment ? `PENILAIAN DIRI:\n${data.selfAssessment}\n` : ''}
${data.achievements ? `PENCAPAIAN:\n${data.achievements}\n` : ''}
${data.challenges ? `TANTANGAN:\n${data.challenges}\n` : ''}
${data.improvementPlan ? `RENCANA PERBAIKAN:\n${data.improvementPlan}\n` : ''}

Buatlah ringkasan kinerja tahunan yang:
1. Objektif dan berdasarkan data
2. Menggunakan bahasa formal dan profesional
3. Mencakup analisis kehadiran, pencapaian SKP, dan penilaian kinerja
4. Memberikan rekomendasi untuk pengembangan karir
5. Panjang sekitar 300-500 kata
6. Menggunakan bahasa Indonesia yang baik dan benar

Format ringkasan harus mencakup:
- Ringkasan Eksekutif
- Analisis Kehadiran
- Analisis Pencapaian SKP
- Evaluasi Kinerja Keseluruhan
- Rekomendasi Pengembangan
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Anda adalah sistem AI yang ahli dalam evaluasi kinerja ASN (Aparatur Sipil Negara) Indonesia. Tugas Anda adalah membuat ringkasan kinerja tahunan yang objektif, profesional, dan sesuai dengan standar penilaian kinerja ASN."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "Gagal menghasilkan ringkasan kinerja."

  } catch (error) {
    console.error("Error generating annual performance summary:", error)
    throw new Error("Failed to generate AI summary")
  }
}

export async function generateSupervisorRecommendations(data: {
  employeeName: string
  year: number
  performancePredicate: string
  strengths?: string
  developmentAreas?: string
  overallRating: number
}): Promise<string> {
  try {
    const prompt = `
Sebagai atasan yang mengevaluasi kinerja bawahan, buatlah rekomendasi pengembangan berdasarkan data berikut:

INFORMASI PEGAWAI:
- Nama: ${data.employeeName}
- Tahun Evaluasi: ${data.year}
- Predikat Kinerja: ${data.performancePredicate}
- Rating Keseluruhan: ${data.overallRating}/5

${data.strengths ? `KEKUATAN:\n${data.strengths}\n` : ''}
${data.developmentAreas ? `AREA PENGEMBANGAN:\n${data.developmentAreas}\n` : ''}

Buatlah rekomendasi yang:
1. Spesifik dan dapat diimplementasikan
2. Sesuai dengan predikat kinerja yang diperoleh
3. Mencakup pengembangan kompetensi dan karir
4. Memberikan langkah-langkah konkret
5. Panjang sekitar 200-300 kata
6. Menggunakan bahasa Indonesia yang formal

Format rekomendasi harus mencakup:
- Rekomendasi Pengembangan Kompetensi
- Rekomendasi Penugasan/Rotasi
- Target Perbaikan untuk Tahun Berikutnya
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Anda adalah atasan yang berpengalaman dalam mengevaluasi dan mengembangkan kinerja pegawai ASN. Tugas Anda adalah memberikan rekomendasi pengembangan yang konstruktif dan dapat diimplementasikan."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "Gagal menghasilkan rekomendasi."

  } catch (error) {
    console.error("Error generating supervisor recommendations:", error)
    throw new Error("Failed to generate supervisor recommendations")
  }
}