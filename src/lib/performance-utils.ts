import { WorkResultRating, BehaviorRating, PerformancePredicate } from "@prisma/client"

/**
 * Calculate performance predicate based on work result and behavior ratings
 */
export function calculatePerformancePredicate(
  workResultRating: WorkResultRating,
  behaviorRating: BehaviorRating
): PerformancePredicate {
  // Performance predicate mapping based on the provided table
  const predicateMap: Record<WorkResultRating, Record<BehaviorRating, PerformancePredicate>> = {
    [WorkResultRating.DIATAS_EKSPEKTASI]: {
      [BehaviorRating.DIATAS_EKSPEKTASI]: PerformancePredicate.SANGAT_BAIK,
      [BehaviorRating.SESUAI_EKSPEKTASI]: PerformancePredicate.BAIK,
      [BehaviorRating.DIBAWAH_EKSPEKTASI]: PerformancePredicate.BAIK
    },
    [WorkResultRating.SESUAI_EKSPEKTASI]: {
      [BehaviorRating.DIATAS_EKSPEKTASI]: PerformancePredicate.BAIK,
      [BehaviorRating.SESUAI_EKSPEKTASI]: PerformancePredicate.BAIK,
      [BehaviorRating.DIBAWAH_EKSPEKTASI]: PerformancePredicate.KURANG
    },
    [WorkResultRating.DIBAWAH_EKSPEKTASI]: {
      [BehaviorRating.DIATAS_EKSPEKTASI]: PerformancePredicate.KURANG,
      [BehaviorRating.SESUAI_EKSPEKTASI]: PerformancePredicate.KURANG,
      [BehaviorRating.DIBAWAH_EKSPEKTASI]: PerformancePredicate.KURANG
    }
  }

  return predicateMap[workResultRating][behaviorRating]
}

/**
 * Calculate attendance percentage from attendance summary data
 */
export function calculateAttendancePercentage(attendanceSummary: Record<string, unknown>): number {
  if (!attendanceSummary || typeof attendanceSummary !== 'object') {
    return 0
  }

  const totalDays = Number(attendanceSummary.total_days) || 0
  const presentDays = Number(attendanceSummary.present_days) || 0

  if (totalDays === 0) return 0
  
  return Math.round((presentDays / totalDays) * 100 * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate SKP completion percentage from SKP summary data
 */
export function calculateSkpCompletionPercentage(skpSummary: Record<string, unknown>): number {
  if (!skpSummary || typeof skpSummary !== 'object') {
    return 0
  }

  const totalItems = Number(skpSummary.total_items) || 0
  const completedItems = Number(skpSummary.completed_items) || 0

  if (totalItems === 0) return 0
  
  return Math.round((completedItems / totalItems) * 100 * 100) / 100 // Round to 2 decimal places
}

/**
 * Determine work result rating based on SKP completion percentage
 */
export function determineWorkResultRating(skpCompletionPercentage: number): WorkResultRating {
  if (skpCompletionPercentage >= 90) {
    return WorkResultRating.DIATAS_EKSPEKTASI
  } else if (skpCompletionPercentage >= 70) {
    return WorkResultRating.SESUAI_EKSPEKTASI
  } else {
    return WorkResultRating.DIBAWAH_EKSPEKTASI
  }
}

/**
 * Determine behavior rating based on attendance percentage and other factors
 */
export function determineBehaviorRating(
  attendancePercentage: number,
  punctualityScore?: number
): BehaviorRating {
  // Base rating on attendance
  let baseScore = 0
  if (attendancePercentage >= 95) {
    baseScore = 3 // Above expectations base
  } else if (attendancePercentage >= 85) {
    baseScore = 2 // Meets expectations base
  } else {
    baseScore = 1 // Below expectations base
  }

  // Adjust based on punctuality if provided
  if (punctualityScore !== undefined) {
    if (punctualityScore >= 4.5) {
      baseScore = Math.max(baseScore, 3)
    } else if (punctualityScore >= 3.5) {
      baseScore = Math.max(baseScore, 2)
    } else {
      baseScore = Math.min(baseScore, 1)
    }
  }

  if (baseScore >= 3) {
    return BehaviorRating.DIATAS_EKSPEKTASI
  } else if (baseScore >= 2) {
    return BehaviorRating.SESUAI_EKSPEKTASI
  } else {
    return BehaviorRating.DIBAWAH_EKSPEKTASI
  }
}

/**
 * Generate performance summary text based on ratings and data
 */
export function generatePerformanceSummaryText(
  workResultRating: WorkResultRating,
  behaviorRating: BehaviorRating,
  performancePredicate: PerformancePredicate,
  attendancePercentage: number,
  skpCompletionPercentage: number
): string {
  const predicateText: Record<PerformancePredicate, string> = {
    [PerformancePredicate.SANGAT_BAIK]: "Sangat Baik",
    [PerformancePredicate.BAIK]: "Baik", 
    [PerformancePredicate.KURANG]: "Kurang"
  }

  const workResultText: Record<WorkResultRating, string> = {
    [WorkResultRating.DIATAS_EKSPEKTASI]: "di atas ekspektasi",
    [WorkResultRating.SESUAI_EKSPEKTASI]: "sesuai ekspektasi",
    [WorkResultRating.DIBAWAH_EKSPEKTASI]: "di bawah ekspektasi"
  }

  const behaviorText: Record<BehaviorRating, string> = {
    [BehaviorRating.DIATAS_EKSPEKTASI]: "di atas ekspektasi",
    [BehaviorRating.SESUAI_EKSPEKTASI]: "sesuai ekspektasi", 
    [BehaviorRating.DIBAWAH_EKSPEKTASI]: "di bawah ekspektasi"
  }

  return `Berdasarkan evaluasi kinerja tahunan, pegawai memperoleh predikat "${predicateText[performancePredicate]}" dengan hasil kerja ${workResultText[workResultRating]} dan perilaku kerja ${behaviorText[behaviorRating]}. Tingkat kehadiran mencapai ${attendancePercentage}% dan penyelesaian SKP mencapai ${skpCompletionPercentage}%.`
}

/**
 * Validate performance report data
 */
export function validatePerformanceReportData(data: {
  attendanceSummary: Record<string, unknown>
  skpSummary: Record<string, unknown>
  workResultRating: WorkResultRating
  behaviorRating: BehaviorRating
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate attendance summary
  if (!data.attendanceSummary || typeof data.attendanceSummary !== 'object') {
    errors.push("Data ringkasan kehadiran tidak valid")
  }

  // Validate SKP summary
  if (!data.skpSummary || typeof data.skpSummary !== 'object') {
    errors.push("Data ringkasan SKP tidak valid")
  }

  // Validate ratings
  const validWorkResultRatings = Object.values(WorkResultRating)
  const validBehaviorRatings = Object.values(BehaviorRating)

  if (!validWorkResultRatings.includes(data.workResultRating)) {
    errors.push("Rating hasil kerja tidak valid")
  }

  if (!validBehaviorRatings.includes(data.behaviorRating)) {
    errors.push("Rating perilaku kerja tidak valid")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}