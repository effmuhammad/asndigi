import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface SkpSummaryData {
  indicator: string
  action_plan: string
  target_realization: string
  supporting_data?: string
  feedback?: string
  status: string
  month: number
  year: number
}

export interface SkpSummaryResponse {
  summary: string
  analysis: {
    achievements: string[]
    challenges: string[]
    recommendations: string[]
  }
  performance_score: number
}

export interface AttendanceSummaryData {
  attendance_date: string
  check_in: string | null
  check_out: string | null
  status: string
  location_data?: Record<string, unknown>
  working_hours?: number
}

export interface AttendanceSummaryResponse {
  executive_summary: string
  attendance_analysis: {
    total_days: number
    present_days: number
    late_days: number
    absent_days: number
    attendance_rate: number
    punctuality_rate: number
  }
  patterns_insights: string[]
  recommendations: string[]
  performance_score: number
}

/**
 * Generate AI summary for SKP entries using OpenAI GPT-4.1-mini
 */
export async function generateSkpSummary(
  skpEntries: SkpSummaryData[],
  employeeName: string,
  period: string
): Promise<SkpSummaryResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    if (!skpEntries || skpEntries.length === 0) {
      throw new Error('No SKP entries provided for summary generation')
    }

    // Prepare the prompt for GPT
    const prompt = `
Anda adalah seorang analis kinerja ASN yang berpengalaman. Buatlah ringkasan komprehensif dari data Sasaran Kinerja Pegawai (SKP) berikut:

**Data Pegawai:**
- Nama: ${employeeName}
- Periode: ${period}

**Data SKP:**
${skpEntries.map((entry, index) => `
${index + 1}. Bulan ${entry.month}/${entry.year}
   - Indikator: ${entry.indicator}
   - Rencana Aksi: ${entry.action_plan}
   - Target Realisasi: ${entry.target_realization}
   - Data Pendukung: ${entry.supporting_data || 'Tidak ada'}
   - Feedback: ${entry.feedback || 'Tidak ada feedback'}
   - Status: ${entry.status}
`).join('\n')}

**Instruksi:**
1. Buatlah ringkasan eksekutif yang menjelaskan kinerja pegawai secara keseluruhan
2. Identifikasi pencapaian utama (achievements)
3. Identifikasi tantangan yang dihadapi (challenges)
4. Berikan rekomendasi untuk perbaikan (recommendations)
5. Berikan skor kinerja dari 1-100 berdasarkan analisis data

**Format Response (JSON):**
{
  "summary": "Ringkasan eksekutif kinerja pegawai dalam bahasa Indonesia yang profesional dan objektif",
  "analysis": {
    "achievements": ["pencapaian 1", "pencapaian 2", "pencapaian 3"],
    "challenges": ["tantangan 1", "tantangan 2", "tantangan 3"],
    "recommendations": ["rekomendasi 1", "rekomendasi 2", "rekomendasi 3"]
  },
  "performance_score": 0 // Will be calculated based on actual data
}

Pastikan response dalam format JSON yang valid dan menggunakan bahasa Indonesia yang formal dan profesional.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o-mini as it's the latest available model
      messages: [
        {
          role: "system",
          content: "Anda adalah analis kinerja ASN yang berpengalaman dalam mengevaluasi Sasaran Kinerja Pegawai. Berikan analisis yang objektif, konstruktif, dan profesional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response received from OpenAI')
    }

    // Parse the JSON response
    const parsedResponse: SkpSummaryResponse = JSON.parse(responseContent)

    // Validate the response structure
    if (!parsedResponse.summary || !parsedResponse.analysis || typeof parsedResponse.performance_score !== 'number') {
      throw new Error('Invalid response format from OpenAI')
    }

    // Calculate objective performance score based on actual data
    const objectiveScore = calculateObjectiveSkpScore(skpEntries)
    parsedResponse.performance_score = objectiveScore

    return parsedResponse

  } catch (error) {
    console.error('Error generating SKP summary:', error)
    
    if (error instanceof Error) {
      throw new Error(`Failed to generate SKP summary: ${error.message}`)
    }
    
    throw new Error('Failed to generate SKP summary: Unknown error')
  }
}

/**
 * Calculate objective SKP performance score based on actual data
 */
function calculateObjectiveSkpScore(skpEntries: SkpSummaryData[]): number {
  if (!skpEntries || skpEntries.length === 0) return 75 // Default neutral score
  
  let totalScore = 0
  let maxPossibleScore = 0
  
  skpEntries.forEach(entry => {
    let entryScore = 0
    let entryMaxScore = 100
    
    // Status-based scoring (40% weight)
    switch (entry.status) {
      case 'APPROVED':
        entryScore += 40
        break
      case 'SUBMITTED':
        entryScore += 30
        break
      case 'DRAFT':
        entryScore += 20
        break
      case 'REJECTED':
        entryScore += 10
        break
      default:
        entryScore += 15
    }
    
    // Content quality scoring (60% weight)
    // Target realization quality (30%)
    if (entry.target_realization && entry.target_realization.length > 0) {
      const realizationLength = entry.target_realization.length
      if (realizationLength > 200) entryScore += 30
      else if (realizationLength > 100) entryScore += 25
      else if (realizationLength > 50) entryScore += 20
      else if (realizationLength > 20) entryScore += 15
      else entryScore += 10
    } else {
      entryScore += 5 // Minimal score for no realization
    }
    
    // Supporting data availability (20%)
    if (entry.supporting_data && entry.supporting_data.length > 0) {
      const supportingLength = entry.supporting_data.length
      if (supportingLength > 100) entryScore += 20
      else if (supportingLength > 50) entryScore += 15
      else if (supportingLength > 20) entryScore += 12
      else entryScore += 8
    } else {
      entryScore += 5 // Minimal score for no supporting data
    }
    
    // Feedback quality (10%)
    if (entry.feedback && entry.feedback.length > 0) {
      const feedbackLength = entry.feedback.length
      if (feedbackLength > 50) entryScore += 10
      else if (feedbackLength > 20) entryScore += 8
      else entryScore += 5
    } else {
      entryScore += 3 // Minimal score for no feedback
    }
    
    totalScore += entryScore
    maxPossibleScore += entryMaxScore
  })
  
  // Calculate average score
  const averageScore = (totalScore / skpEntries.length)
  
  // Apply normalization to ensure score is within reasonable bounds (50-100)
  return Math.max(50, Math.min(100, Math.round(averageScore)))
}

/**
 * Calculate objective attendance performance score based on actual data
 */
function calculateObjectiveAttendanceScore(attendanceData: AttendanceSummaryData[]): number {
  if (!attendanceData || attendanceData.length === 0) return 75 // Default neutral score
  
  let totalScore = 0
  
  attendanceData.forEach(entry => {
    let entryScore = 0
    
    // Attendance status scoring (100% weight)
    switch (entry.status) {
      case 'PRESENT':
        entryScore += 100
        break
      case 'SICK':
        entryScore += 70
        break
      case 'LEAVE':
        entryScore += 60
        break
      case 'ABSENT':
        entryScore += 0
        break
      case 'LATE':
        entryScore += 50 // Late arrival penalty
        break
      case 'EARLY_LEAVE':
        entryScore += 40 // Early leave penalty
        break
      default:
        entryScore += 30 // Unknown status gets minimal score
    }
    
    // Additional factors for presence
    if (entry.status === 'PRESENT') {
      // Check-in time bonus (up to 10 points)
      if (entry.check_in) {
        const checkInHour = parseInt(entry.check_in.split(':')[0])
        if (checkInHour <= 8) entryScore += 10 // Early arrival bonus
        else if (checkInHour <= 9) entryScore += 5 // On-time arrival
        else entryScore -= 5 // Late arrival penalty
      }
      
      // Check-out time bonus (up to 10 points)
      if (entry.check_out) {
        const checkOutHour = parseInt(entry.check_out.split(':')[0])
        if (checkOutHour >= 17) entryScore += 10 // Full day bonus
        else if (checkOutHour >= 16) entryScore += 5 // Near full day
        else entryScore -= 5 // Early departure penalty
      }
      
      // Work duration bonus (up to 20 points)
      if (entry.check_in && entry.check_out) {
        const checkInMinutes = timeToMinutes(entry.check_in)
        const checkOutMinutes = timeToMinutes(entry.check_out)
        const workDuration = checkOutMinutes - checkInMinutes
        
        if (workDuration >= 480) entryScore += 20 // 8+ hours
        else if (workDuration >= 420) entryScore += 15 // 7+ hours
        else if (workDuration >= 360) entryScore += 10 // 6+ hours
        else if (workDuration >= 300) entryScore += 5 // 5+ hours
        else entryScore -= 10 // Less than 5 hours penalty
      }
      
      // Working hours bonus (if available)
      if (entry.working_hours) {
        if (entry.working_hours >= 8) entryScore += 5
        else if (entry.working_hours >= 7) entryScore += 3
        else if (entry.working_hours >= 6) entryScore += 1
        else entryScore -= 3
      }
    }
    
    // Ensure score is within bounds
    entryScore = Math.max(0, Math.min(120, entryScore))
    totalScore += entryScore
  })
  
  // Calculate average score
  const averageScore = (totalScore / attendanceData.length)
  
  // Normalize to 50-100 range for consistency with SKP scoring
  return Math.max(50, Math.min(100, Math.round(averageScore)))
}

/**
 * Convert time string (HH:MM) to minutes
 */
function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Generate AI summary for a single SKP entry
 */
export async function generateSingleSkpSummary(
  skpEntry: SkpSummaryData,
  employeeName: string
): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const prompt = `
Buatlah ringkasan singkat untuk entri SKP berikut:

**Pegawai:** ${employeeName}
**Periode:** ${skpEntry.month}/${skpEntry.year}
**Indikator:** ${skpEntry.indicator}
**Rencana Aksi:** ${skpEntry.action_plan}
**Target Realisasi:** ${skpEntry.target_realization}
**Status:** ${skpEntry.status}

Buatlah ringkasan dalam 2-3 kalimat yang menjelaskan pencapaian dan status dari SKP ini dalam bahasa Indonesia yang profesional.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Anda adalah analis kinerja yang membuat ringkasan singkat dan objektif untuk entri SKP pegawai."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 200
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response received from OpenAI')
    }

    return responseContent.trim()

  } catch (error) {
    console.error('Error generating single SKP summary:', error)
    throw new Error('Failed to generate SKP summary')
  }
}

/**
 * Generate AI summary for attendance data using OpenAI GPT-4.1-mini
 */
export async function generateAttendanceSummary(
  attendanceData: AttendanceSummaryData[],
  employeeName: string,
  period: string
): Promise<AttendanceSummaryResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    if (!attendanceData || attendanceData.length === 0) {
      throw new Error('No attendance data provided for summary generation')
    }

    // Calculate basic statistics
    const totalDays = attendanceData.length
    const presentDays = attendanceData.filter(d => ['PRESENT', 'LATE', 'EARLY_LEAVE'].includes(d.status)).length
    const lateDays = attendanceData.filter(d => d.status === 'LATE').length
    const absentDays = attendanceData.filter(d => ['ABSENT', 'SICK', 'LEAVE'].includes(d.status)).length
    const attendanceRate = (presentDays / totalDays) * 100
    const punctualityRate = ((presentDays - lateDays) / totalDays) * 100

    // Prepare the prompt for GPT
    const prompt = `
Anda adalah seorang analis HR yang berpengalaman. Buatlah ringkasan komprehensif dari data presensi pegawai berikut:

**Data Pegawai:**
- Nama: ${employeeName}
- Periode: ${period}
- Total Hari Kerja: ${totalDays}
- Hari Hadir: ${presentDays}
- Hari Terlambat: ${lateDays}
- Hari Tidak Hadir: ${absentDays}
- Tingkat Kehadiran: ${attendanceRate.toFixed(1)}%
- Tingkat Ketepatan Waktu: ${punctualityRate.toFixed(1)}%

**Detail Data Presensi:**
${attendanceData.map((entry, index) => `
${index + 1}. Tanggal: ${entry.attendance_date}
   - Check In: ${entry.check_in || 'Tidak ada'}
   - Check Out: ${entry.check_out || 'Tidak ada'}
   - Status: ${entry.status}
   - Jam Kerja: ${entry.working_hours || 'N/A'} jam
`).join('')}

Berikan analisis dalam format JSON dengan struktur berikut:
{
  "executive_summary": "Ringkasan eksekutif tentang performa kehadiran pegawai",
  "attendance_analysis": {
    "total_days": ${totalDays},
    "present_days": ${presentDays},
    "late_days": ${lateDays},
    "absent_days": ${absentDays},
    "attendance_rate": ${attendanceRate},
    "punctuality_rate": ${punctualityRate}
  },
  "patterns_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommendations": ["Rekomendasi 1", "Rekomendasi 2", "Rekomendasi 3"],
  "performance_score": 0 // Will be calculated based on actual data
}

Pastikan:
1. Executive summary menjelaskan performa kehadiran secara keseluruhan
2. Patterns insights mengidentifikasi pola-pola dalam data kehadiran
3. Recommendations memberikan saran perbaikan yang actionable
4. Performance score (0-100) berdasarkan tingkat kehadiran dan ketepatan waktu
5. Gunakan bahasa Indonesia yang profesional dan objektif
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Anda adalah analis HR yang membuat ringkasan objektif dan profesional untuk data presensi pegawai. Berikan response dalam format JSON yang valid."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response received from OpenAI')
    }

    try {
      const parsedResponse = JSON.parse(responseContent) as AttendanceSummaryResponse
      
      // Calculate objective performance score based on actual data
      const objectiveScore = calculateObjectiveAttendanceScore(attendanceData)
      parsedResponse.performance_score = objectiveScore
      
      return parsedResponse
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      throw new Error('Invalid response format from OpenAI')
    }

  } catch (error) {
    console.error('Error generating attendance summary:', error)
    throw new Error('Failed to generate attendance summary')
  }
}