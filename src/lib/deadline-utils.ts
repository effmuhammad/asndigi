/**
 * Utility functions for calculating deadlines
 */

/**
 * Calculate deadline: 6 working days after the end of the given month
 * Excludes weekends (Saturday = 6, Sunday = 0)
 * 
 * @param year - The year of the task month
 * @param month - The month of the task (1-12)
 * @returns Date object representing the deadline
 */
export function calculateDeadline(year: number, month: number): Date {
  // Get the last day of the given month
  const lastDayOfMonth = new Date(year, month, 0) // month is 1-indexed, but Date constructor expects 0-indexed
  
  // Start from the day after the last day of the month
  let currentDate = new Date(lastDayOfMonth)
  currentDate.setDate(currentDate.getDate() + 1)
  
  let workingDaysAdded = 0
  
  // Add 6 working days (excluding weekends)
  while (workingDaysAdded < 6) {
    const dayOfWeek = currentDate.getDay() // 0 = Sunday, 6 = Saturday
    
    // If it's not a weekend (Saturday or Sunday), count it as a working day
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDaysAdded++
    }
    
    // If we haven't reached 6 working days yet, move to the next day
    if (workingDaysAdded < 6) {
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }
  
  return currentDate
}

/**
 * Format deadline date to Indonesian locale string
 * 
 * @param deadline - The deadline date
 * @returns Formatted date string
 */
export function formatDeadline(deadline: Date): string {
  return deadline.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Check if current date has passed the deadline
 * 
 * @param deadline - The deadline date
 * @returns true if deadline has passed, false otherwise
 */
export function isDeadlinePassed(deadline: Date): boolean {
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Reset time to start of day for fair comparison
  
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(23, 59, 59, 999) // Set to end of deadline day
  
  return now > deadlineDate
}

/**
 * Get days remaining until deadline
 * 
 * @param deadline - The deadline date
 * @returns Number of days remaining (negative if passed)
 */
export function getDaysUntilDeadline(deadline: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)
  
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Check if submission date is late compared to deadline
 * 
 * @param submissionDate - The actual submission date (string or Date)
 * @param deadline - The deadline date
 * @returns true if submission was late, false otherwise
 */
export function isSubmissionLate(submissionDate: string | Date, deadline: Date): boolean {
  if (!submissionDate) return false
  
  const submission = new Date(submissionDate)
  submission.setHours(0, 0, 0, 0)
  
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(23, 59, 59, 999) // Set to end of deadline day
  
  return submission > deadlineDate
}