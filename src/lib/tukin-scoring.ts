/**
 * Utility functions for calculating Tukin scores based on report submission timeliness
 */

/**
 * Calculate Tukin score based on submission timeliness
 * Following the scoring table:
 * - 1-6 days: 0 days late, score 10%
 * - 7 days: 1 day late, score 8%
 * - 8 days: 2 days late, score 6%
 * - 9 days: 3 days late, score 5%
 * - 10 days: 4 days late, score 5%
 * - >10 days: >5 days late, score 0%
 * 
 * @param submissionDate - The actual submission date
 * @param deadline - The deadline date
 * @returns Object containing days late and Tukin score percentage
 */
export function calculateTukinScore(submissionDate: string | Date, deadline: Date): {
  daysLate: number;
  tukinScore: number;
  timelinessCategory: string;
} {
  if (!submissionDate) {
    return {
      daysLate: -1,
      tukinScore: 0,
      timelinessCategory: 'Belum Mengumpulkan'
    };
  }

  const submission = new Date(submissionDate);
  submission.setHours(0, 0, 0, 0);
  
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(23, 59, 59, 999); // Set to end of deadline day
  
  // Calculate days difference
  const diffTime = submission.getTime() - deadlineDate.getTime();
  const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Determine Tukin score based on days late
  let tukinScore: number;
  let timelinessCategory: string;
  
  if (daysLate <= 0) {
    // Submitted on time (1-6 days after month end)
    tukinScore = 10;
    timelinessCategory = 'Tepat Waktu';
  } else if (daysLate === 1) {
    // 1 day late (7 days after month end)
    tukinScore = 8;
    timelinessCategory = 'Terlambat 1 Hari';
  } else if (daysLate === 2) {
    // 2 days late (8 days after month end)
    tukinScore = 6;
    timelinessCategory = 'Terlambat 2 Hari';
  } else if (daysLate === 3) {
    // 3 days late (9 days after month end)
    tukinScore = 5;
    timelinessCategory = 'Terlambat 3 Hari';
  } else if (daysLate === 4) {
    // 4 days late (10 days after month end)
    tukinScore = 5;
    timelinessCategory = 'Terlambat 4 Hari';
  } else {
    // More than 4 days late (>10 days after month end)
    tukinScore = 0;
    timelinessCategory = 'Terlambat >4 Hari';
  }
  
  return {
    daysLate: Math.max(0, daysLate),
    tukinScore,
    timelinessCategory
  };
}

/**
 * Calculate average Tukin score for multiple entries
 * 
 * @param entries - Array of entries with submission dates
 * @param getDeadline - Function to get deadline for each entry
 * @returns Average Tukin score and detailed statistics
 */
export function calculateAverageTukinScore(
  entries: Array<{ supporting_data_submission_date?: string | null; deadline?: Date }>
): {
  averageScore: number;
  totalEntries: number;
  submittedEntries: number;
  onTimeEntries: number;
  lateEntries: number;
  notSubmittedEntries: number;
  scoreDistribution: { [key: string]: number };
} {
  if (!entries || entries.length === 0) {
    return {
      averageScore: 0,
      totalEntries: 0,
      submittedEntries: 0,
      onTimeEntries: 0,
      lateEntries: 0,
      notSubmittedEntries: 0,
      scoreDistribution: {}
    };
  }

  let totalScore = 0;
  let submittedCount = 0;
  let onTimeCount = 0;
  let lateCount = 0;
  let notSubmittedCount = 0;
  const scoreDistribution: { [key: string]: number } = {
    '10': 0,
    '8': 0,
    '6': 0,
    '5': 0,
    '0': 0
  };

  entries.forEach(entry => {
    if (!entry.supporting_data_submission_date || !entry.deadline) {
      notSubmittedCount++;
      return;
    }

    const scoreResult = calculateTukinScore(entry.supporting_data_submission_date, entry.deadline);
    totalScore += scoreResult.tukinScore;
    submittedCount++;
    
    if (scoreResult.daysLate <= 0) {
      onTimeCount++;
    } else {
      lateCount++;
    }
    
    scoreDistribution[scoreResult.tukinScore.toString()]++;
  });

  const averageScore = submittedCount > 0 ? totalScore / submittedCount : 0;

  return {
    averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
    totalEntries: entries.length,
    submittedEntries: submittedCount,
    onTimeEntries: onTimeCount,
    lateEntries: lateCount,
    notSubmittedEntries: notSubmittedCount,
    scoreDistribution
  };
}

/**
 * Generate AI analysis for submission patterns
 * 
 * @param entries - Array of entries with submission dates
 * @returns Analysis object with insights and recommendations
 */
export function generateSubmissionAnalysis(
  entries: Array<{ supporting_data_submission_date?: string | null; deadline?: Date; month: number; year: number }>
): {
  pattern: string;
  insights: string[];
  recommendations: string[];
  trend: string;
} {
  if (!entries || entries.length === 0) {
    return {
      pattern: 'Tidak ada data',
      insights: ['Belum ada data pengumpulan laporan'],
      recommendations: ['Mulai mengumpulkan laporan untuk mendapatkan analisis'],
      trend: 'Netral'
    };
  }

  const stats = calculateAverageTukinScore(entries);
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Basic statistics
  insights.push(`Tingkat pengumpulan: ${stats.submittedEntries}/${stats.totalEntries} (${Math.round((stats.submittedEntries / stats.totalEntries) * 100)}%)`);
  insights.push(`Rata-rata skor Tukin: ${stats.averageScore}/10`);
  insights.push(`Laporan tepat waktu: ${stats.onTimeEntries}/${stats.submittedEntries} (${Math.round((stats.onTimeEntries / stats.submittedEntries) * 100)}%)`);

  // Pattern analysis
  if (stats.averageScore >= 8) {
    insights.push('Performa pengumpulan laporan sangat baik');
    recommendations.push('Pertahankan konsistensi pengumpulan tepat waktu');
  } else if (stats.averageScore >= 6) {
    insights.push('Performa pengumpulan laporan cukup baik, masih ada ruang untuk perbaikan');
    recommendations.push('Tingkatkan disiplin waktu untuk pengumpulan laporan');
  } else if (stats.averageScore > 0) {
    insights.push('Performa pengumpulan laporan perlu perhatian');
    recommendations.push('Evaluasi hambatan dalam proses pengumpulan laporan');
    recommendations.push('Buat pengingat untuk batas waktu pengumpulan');
  } else {
    insights.push('Belum ada laporan yang dikumpulkan');
    recommendations.push('Segera mulai proses pengumpulan laporan');
    recommendations.push('Koordinasikan dengan atasan untuk bimbingan');
  }

  // Specific recommendations based on score distribution
  if (stats.scoreDistribution['0'] > 0) {
    recommendations.push(`${stats.scoreDistribution['0']} laporan terlambat >4 hari - perlu perhatian serius`);
  }
  
  if (stats.scoreDistribution['5'] > 0 || stats.scoreDistribution['6'] > 0) {
    recommendations.push('Beberapa laporan terlambat 2-3 hari - tingkatkan kedisiplinan');
  }

  // Trend analysis (simplified)
  let trend = 'Netral';
  if (stats.averageScore >= 8) {
    trend = 'Sangat Baik';
  } else if (stats.averageScore >= 6) {
    trend = 'Baik';
  } else if (stats.averageScore > 0) {
    trend = 'Perlu Perbaikan';
  } else {
    trend = 'Belum Ada Data';
  }

  return {
    pattern: `Rata-rata skor ${stats.averageScore}/10 dengan ${stats.onTimeEntries} laporan tepat waktu`,
    insights,
    recommendations,
    trend
  };
}

/**
 * Generate deep AI analysis for submission patterns with detailed insights
 * 
 * @param entries - Array of SKP entries with detailed information
 * @param behaviors - Array of behavior entries
 * @param selectedMonth - Current selected month
 * @param selectedYear - Current selected year
 * @returns Deep analysis object with comprehensive insights
 */
export function generateDeepAnalysis(
  entries: Array<{
    id: string;
    indicator: string;
    action_plan: string;
    target_realization: string;
    supporting_data?: string | null;
    supporting_data_submission_date?: string | null;
    feedback?: string | null;
    status: string;
    month: number;
    year: number;
    deadline?: Date;
    user: { name: string; nip: string };
  }>,
  behaviors: Array<{
    id: string;
    behavior: string;
    behavior_category?: string | null;
    feedback: string;
    assessment_score?: number | null;
    improvement_notes?: string | null;
    month: number;
    year: number;
    user: { name: string; nip: string };
  }>,
  selectedMonth: number,
  selectedYear: number
): {
  executive_summary: string;
  performance_analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  detailed_insights: {
    submission_patterns: string[];
    quality_assessment: string[];
    behavioral_trends: string[];
    comparative_analysis: string[];
  };
  strategic_recommendations: {
    immediate_actions: string[];
    short_term_goals: string[];
    long_term_strategies: string[];
  };
  risk_assessment: {
    low_risk: string[];
    medium_risk: string[];
    high_risk: string[];
  };
  performance_score: number;
} {
  if (!entries && !behaviors) {
    return {
      executive_summary: 'Tidak cukup data untuk analisis mendalam',
      performance_analysis: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      detailed_insights: { submission_patterns: [], quality_assessment: [], behavioral_trends: [], comparative_analysis: [] },
      strategic_recommendations: { immediate_actions: [], short_term_goals: [], long_term_strategies: [] },
      risk_assessment: { low_risk: [], medium_risk: [], high_risk: [] },
      performance_score: 0
    };
  }

  // Calculate comprehensive metrics
  const submissionStats = entries ? calculateAverageTukinScore(entries) : null;
  const currentMonthEntries = entries?.filter(e => e.month === selectedMonth && e.year === selectedYear) || [];
  const currentMonthBehaviors = behaviors?.filter(b => b.month === selectedMonth && b.year === selectedYear) || [];
  
  // Performance scoring
  let performanceScore = 0;
  if (submissionStats) {
    performanceScore += (submissionStats.averageScore / 10) * 60; // 60% weight for submission
  }
  if (behaviors && behaviors.length > 0) {
    const avgBehaviorScore = behaviors.reduce((sum, b) => sum + (b.assessment_score || 3), 0) / behaviors.length;
    performanceScore += (avgBehaviorScore / 5) * 40; // 40% weight for behavior
  }
  performanceScore = Math.round(performanceScore * 10) / 10;

  // Executive Summary
  const executive_summary = generateExecutiveSummary(submissionStats, currentMonthEntries, currentMonthBehaviors, selectedMonth, selectedYear);

  // SWOT Analysis
  const performance_analysis = generateSWOTAnalysis(submissionStats, currentMonthEntries, currentMonthBehaviors);

  // Detailed Insights
  const detailed_insights = generateDetailedInsights(submissionStats, currentMonthEntries, currentMonthBehaviors, entries || [], behaviors || []);

  // Strategic Recommendations
  const strategic_recommendations = generateStrategicRecommendations(submissionStats, currentMonthEntries, currentMonthBehaviors);

  // Risk Assessment
  const risk_assessment = generateRiskAssessment(submissionStats, currentMonthEntries, currentMonthBehaviors);

  return {
    executive_summary,
    performance_analysis,
    detailed_insights,
    strategic_recommendations,
    risk_assessment,
    performance_score: performanceScore
  };
}

/**
 * Generate executive summary based on data analysis
 */
function generateExecutiveSummary(
  submissionStats: any,
  currentMonthEntries: any[],
  currentMonthBehaviors: any[],
  selectedMonth: number,
  selectedYear: number
): string {
  const monthName = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][selectedMonth - 1];
  
  let summary = `Analisis Kinerja SKP Bulanan - ${monthName} ${selectedYear}. `;
  
  if (submissionStats) {
    summary += `Tingkat pengumpulan laporan: ${submissionStats.submittedEntries}/${submissionStats.totalEntries} (${Math.round((submissionStats.submittedEntries / submissionStats.totalEntries) * 100)}%). `;
    summary += `Rata-rata skor Tukin: ${submissionStats.averageScore}/10. `;
    summary += `Laporan tepat waktu: ${submissionStats.onTimeEntries}/${submissionStats.submittedEntries} (${Math.round((submissionStats.onTimeEntries / submissionStats.submittedEntries) * 100)}%). `;
  }
  
  if (currentMonthBehaviors.length > 0) {
    const avgBehaviorScore = currentMonthBehaviors.reduce((sum, b) => sum + (b.assessment_score || 3), 0) / currentMonthBehaviors.length;
    summary += `Skor perilaku rata-rata: ${avgBehaviorScore.toFixed(1)}/5. `;
  }
  
  // Add performance level assessment
  if (submissionStats?.averageScore >= 8) {
    summary += 'Performa sangat baik, konsistensi pengumpulan laporan memuaskan.';
  } else if (submissionStats?.averageScore >= 6) {
    summary += 'Performa cukup baik, ada ruang untuk peningkatan disiplin waktu.';
  } else if (submissionStats?.averageScore > 0) {
    summary += 'Performa perlu perhatian, perlu evaluasi sistem pengumpulan laporan.';
  } else {
    summary += 'Belum ada data pengumpulan yang dapat dianalisis.';
  }
  
  return summary;
}

/**
 * Generate SWOT Analysis
 */
function generateSWOTAnalysis(
  submissionStats: any,
  currentMonthEntries: any[],
  currentMonthBehaviors: any[]
): {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  if (submissionStats) {
    if (submissionStats.averageScore >= 8) {
      strengths.push(`Skor Tukin tinggi (${submissionStats.averageScore}/10) menunjukkan disiplin pengumpulan yang baik`);
    }
    if (submissionStats.onTimeEntries > submissionStats.submittedEntries * 0.8) {
      strengths.push('Mayoritas laporan dikumpulkan tepat waktu (>80%)');
    }
    if (submissionStats.averageScore < 6) {
      weaknesses.push(`Skor Tukin rendah (${submissionStats.averageScore}/10) menunjukkan masalah disiplin waktu`);
    }
    if (submissionStats.notSubmittedEntries > 0) {
      weaknesses.push(`Ada ${submissionStats.notSubmittedEntries} laporan yang belum dikumpulkan`);
    }
  }

  if (currentMonthEntries.length > 0) {
    const approvedEntries = currentMonthEntries.filter(e => e.status === 'APPROVED').length;
    if (approvedEntries > 0) {
      strengths.push(`${approvedEntries} laporan telah disetujui oleh atasan`);
    }
    const pendingEntries = currentMonthEntries.filter(e => e.status === 'SUBMITTED').length;
    if (pendingEntries > 0) {
      opportunities.push(`${pendingEntries} laporan menunggu persetujuan atasan`);
    }
  }

  if (currentMonthBehaviors.length > 0) {
    const avgBehaviorScore = currentMonthBehaviors.reduce((sum, b) => sum + (b.assessment_score || 3), 0) / currentMonthBehaviors.length;
    if (avgBehaviorScore >= 4) {
      strengths.push(`Skor perilaku baik (${avgBehaviorScore.toFixed(1)}/5) menunjukkan kinerja profesional`);
    } else {
      weaknesses.push(`Skor perilaku perlu ditingkatkan (${avgBehaviorScore.toFixed(1)}/5)`);
    }
  }

  // Add general opportunities and threats
  opportunities.push('Peningkatan sistem pengingat otomatis untuk batas waktu');
  opportunities.push('Pelatihan manajemen waktu untuk pegawai');
  opportunities.push('Implementasi sistem monitoring real-time');
  
  threats.push('Resiko sanksi administratif jika ketepatan waktu tidak ditingkatkan');
  threats.push('Dampak negatif terhadap penilaian kinerja tahunan');
  threats.push('Potensi penurunan motivasi tim jika tidak ada perbaikan');

  return { strengths, weaknesses, opportunities, threats };
}

/**
 * Generate detailed insights
 */
function generateDetailedInsights(
  submissionStats: any,
  currentMonthEntries: any[],
  currentMonthBehaviors: any[],
  allEntries: any[],
  allBehaviors: any[]
): {
  submission_patterns: string[];
  quality_assessment: string[];
  behavioral_trends: string[];
  comparative_analysis: string[];
} {
  const submission_patterns: string[] = [];
  const quality_assessment: string[] = [];
  const behavioral_trends: string[] = [];
  const comparative_analysis: string[] = [];

  // Submission patterns
  if (submissionStats) {
    submission_patterns.push(`Distribusi skor: 10(${submissionStats.scoreDistribution['10']}) 8(${submissionStats.scoreDistribution['8']}) 6(${submissionStats.scoreDistribution['6']}) 5(${submissionStats.scoreDistribution['5']}) 0(${submissionStats.scoreDistribution['0']})`);
    submission_patterns.push(`Persentase ketepatan waktu: ${Math.round((submissionStats.onTimeEntries / submissionStats.submittedEntries) * 100)}%`);
    if (submissionStats.lateEntries > 0) {
      submission_patterns.push(`Rata-rata keterlambatan: ${submissionStats.lateEntries} laporan terlambat dari ${submissionStats.submittedEntries} yang dikumpulkan`);
    }
  }

  // Quality assessment
  if (currentMonthEntries.length > 0) {
    const entriesWithFeedback = currentMonthEntries.filter(e => e.feedback && e.feedback.length > 10).length;
    const entriesWithSupportingData = currentMonthEntries.filter(e => e.supporting_data).length;
    quality_assessment.push(`${entriesWithFeedback} dari ${currentMonthEntries.length} laporan memiliki feedback yang memadai`);
    quality_assessment.push(`${entriesWithSupportingData} dari ${currentMonthEntries.length} laporan memiliki data pendukung`);
    
    const approvedCount = currentMonthEntries.filter(e => e.status === 'APPROVED').length;
    const submittedCount = currentMonthEntries.filter(e => e.status === 'SUBMITTED').length;
    quality_assessment.push(`Status laporan: ${approvedCount} disetujui, ${submittedCount} menunggu persetujuan, ${currentMonthEntries.length - approvedCount - submittedCount} draft`);
  }

  // Behavioral trends
  if (currentMonthBehaviors.length > 0) {
    const behaviorCategories = [...new Set(currentMonthBehaviors.map(b => b.behavior_category).filter(Boolean))];
    behavioral_trends.push(`Kategori perilaku yang dinilai: ${behaviorCategories.join(', ')}`);
    
    const avgScore = currentMonthBehaviors.reduce((sum, b) => sum + (b.assessment_score || 3), 0) / currentMonthBehaviors.length;
    behavioral_trends.push(`Skor perilaku rata-rata: ${avgScore.toFixed(1)}/5`);
    
    const completeFeedback = currentMonthBehaviors.filter(b => b.feedback && b.feedback.length > 20).length;
    behavioral_trends.push(`${completeFeedback} dari ${currentMonthBehaviors.length} penilaian perilaku memiliki feedback lengkap`);
  }

  // Comparative analysis
  if (allEntries.length > currentMonthEntries.length) {
    const historicalAvgScore = calculateAverageTukinScore(allEntries);
    if (submissionStats && historicalAvgScore.averageScore !== submissionStats.averageScore) {
      comparative_analysis.push(`Bandingkan dengan rata-rata historis: ${historicalAvgScore.averageScore}/10`);
    }
  }
  
  if (allBehaviors.length > currentMonthBehaviors.length) {
    const historicalBehaviorAvg = allBehaviors.reduce((sum, b) => sum + (b.assessment_score || 3), 0) / allBehaviors.length;
    const currentBehaviorAvg = currentMonthBehaviors.length > 0 ? currentMonthBehaviors.reduce((sum, b) => sum + (b.assessment_score || 3), 0) / currentMonthBehaviors.length : 0;
    comparative_analysis.push(`Tren perilaku: historis ${historicalBehaviorAvg.toFixed(1)}/5 vs saat ini ${currentBehaviorAvg.toFixed(1)}/5`);
  }

  return { submission_patterns, quality_assessment, behavioral_trends, comparative_analysis };
}

/**
 * Generate strategic recommendations
 */
function generateStrategicRecommendations(
  submissionStats: any,
  currentMonthEntries: any[],
  currentMonthBehaviors: any[]
): {
  immediate_actions: string[];
  short_term_goals: string[];
  long_term_strategies: string[];
} {
  const immediate_actions: string[] = [];
  const short_term_goals: string[] = [];
  const long_term_strategies: string[] = [];

  // Immediate actions (within 1 week)
  if (submissionStats?.notSubmittedEntries > 0) {
    immediate_actions.push('Segera kumpulkan laporan yang belum dikumpulkan sebelum batas waktu berakhir');
  }
  if (submissionStats?.averageScore < 6) {
    immediate_actions.push('Evaluasi hambatan pengumpulan laporan dan konsultasikan dengan atasan');
  }
  if (currentMonthBehaviors.length === 0) {
    immediate_actions.push('Lakukan penilaian perilaku untuk periode ini jika belum dilakukan');
  }

  // Short-term goals (within 1 month)
  if (submissionStats?.scoreDistribution['0'] > 0) {
    short_term_goals.push('Tingkatkan disiplin waktu untuk menghindari keterlambatan >4 hari');
  }
  if (currentMonthEntries.filter(e => !e.feedback || e.feedback.length < 10).length > 0) {
    short_term_goals.push('Lengkapi feedback untuk semua laporan yang membutuhkan');
  }
  short_term_goals.push('Implementasi sistem pengingat otomatis 3 hari sebelum deadline');
  short_term_goals.push('Buat template standar untuk laporan agar lebih efisien');

  // Long-term strategies (3-6 months)
  long_term_strategies.push('Kembangkan sistem manajemen kinerja berbasis digital');
  long_term_strategies.push('Lakukan pelatihan manajemen waktu dan prioritas untuk pegawai');
  long_term_strategies.push('Implementasi evaluasi kinerja berkala setiap triwulan');
  long_term_strategies.push('Kembangkan budaya kerja yang berorientasi pada target dan deadline');
  long_term_strategies.push('Bangun sistem reward and punishment yang adil untuk kinerja');

  return { immediate_actions, short_term_goals, long_term_strategies };
}

/**
 * Generate risk assessment
 */
function generateRiskAssessment(
  submissionStats: any,
  currentMonthEntries: any[],
  currentMonthBehaviors: any[]
): {
  low_risk: string[];
  medium_risk: string[];
  high_risk: string[];
} {
  const low_risk: string[] = [];
  const medium_risk: string[] = [];
  const high_risk: string[] = [];

  if (submissionStats) {
    if (submissionStats.averageScore >= 8 && submissionStats.onTimeEntries > submissionStats.submittedEntries * 0.8) {
      low_risk.push('Ketepatan waktu pengumpulan laporan sangat baik');
    }
    if (submissionStats.averageScore >= 6 && submissionStats.averageScore < 8) {
      medium_risk.push('Skor Tukin menengah, perlu perhatian untuk peningkatan');
    }
    if (submissionStats.averageScore < 6) {
      high_risk.push('Skor Tukin rendah, berpotensi mempengaruhi penilaian kinerja');
    }
    if (submissionStats.notSubmittedEntries > submissionStats.totalEntries * 0.2) {
      high_risk.push(`Terlalu banyak laporan yang belum dikumpulkan (${submissionStats.notSubmittedEntries})`);
    }
  }

  if (currentMonthEntries.length > 0) {
    const pendingTooLong = currentMonthEntries.filter(e => e.status === 'SUBMITTED').length;
    if (pendingTooLong > 0) {
      medium_risk.push(`${pendingTooLong} laporan menunggu persetujuan terlalu lama`);
    }
  }

  if (currentMonthBehaviors.length > 0) {
    const avgBehaviorScore = currentMonthBehaviors.reduce((sum, b) => sum + (b.assessment_score || 3), 0) / currentMonthBehaviors.length;
    if (avgBehaviorScore < 3) {
      high_risk.push('Skor perilaku rendah dapat mempengaruhi penilaian keseluruhan');
    } else if (avgBehaviorScore < 4) {
      medium_risk.push('Skor perilaku perlu ditingkatkan untuk kinerja optimal');
    }
  }

  // Add general risks
  low_risk.push('Sistem pengumpulan laporan berjalan normal');
  medium_risk.push('Potensi peningkatan beban kerja di bulan berikutnya');
  high_risk.push('Resiko sanksi administratif jika ketepatan waktu tidak ditingkatkan');

  return { low_risk, medium_risk, high_risk };
}

/**
 * Calculate monthly SKP score based on AI analysis of work results
 * Following PP No. 46 Tahun 2011 scoring table:
 * - 91+: Sangat tinggi (Diatas ekspektasi)
 * - 85-90: Tinggi (Diatas ekspektasi)  
 * - 71-85: Sedang (Sesuai Ekspektasi)
 * - <70: Kurang (Dibawah ekspektasi)
 * 
 * @param aiScore - AI analysis score (0-100)
 * @returns Object containing work result rating, predicate, and score
 */
export function calculateSkpWorkResultScore(aiScore: number): {
  workResultRating: string;
  predicate: string;
  score: number;
  category: string;
} {
  if (aiScore >= 91) {
    return {
      workResultRating: 'Diatas ekspektasi',
      predicate: 'Sangat tinggi',
      score: aiScore,
      category: 'Sangat Baik'
    };
  } else if (aiScore >= 85 && aiScore <= 90) {
    return {
      workResultRating: 'Diatas ekspektasi',
      predicate: 'Tinggi',
      score: aiScore,
      category: 'Baik'
    };
  } else if (aiScore >= 71 && aiScore <= 84) {
    return {
      workResultRating: 'Sesuai Ekspektasi',
      predicate: 'Sedang',
      score: aiScore,
      category: 'Cukup'
    };
  } else {
    return {
      workResultRating: 'Dibawah ekspektasi',
      predicate: 'Kurang',
      score: aiScore,
      category: 'Kurang'
    };
  }
}

/**
 * Calculate behavior score based on manual assessment
 * Score range: 1-5 (5 being excellent)
 * 
 * @param behaviorScore - Manual behavior assessment score (1-5)
 * @returns Object containing behavior rating and category
 */
export function calculateBehaviorScore(behaviorScore: number): {
  behaviorRating: string;
  category: string;
  score: number;
} {
  if (behaviorScore >= 4.5) {
    return {
      behaviorRating: 'Diatas ekspektasi',
      category: 'Sangat Baik',
      score: behaviorScore
    };
  } else if (behaviorScore >= 3.5 && behaviorScore < 4.5) {
    return {
      behaviorRating: 'Sesuai Ekspektasi',
      category: 'Baik',
      score: behaviorScore
    };
  } else if (behaviorScore >= 2.5 && behaviorScore < 3.5) {
    return {
      behaviorRating: 'Sesuai Ekspektasi',
      category: 'Cukup',
      score: behaviorScore
    };
  } else {
    return {
      behaviorRating: 'Dibawah ekspektasi',
      category: 'Kurang',
      score: behaviorScore
    };
  }
}

/**
 * Calculate final Tukin score based on work result and behavior ratings
 * Following Permenpan RB No. 6 Th 2022, PM 46 Th 2023, BKN No. 5 Th 2020
 * 
 * @param workResultRating - Work result rating from AI analysis
 * @param behaviorRating - Behavior rating from manual assessment
 * @param timelinessScore - Timeliness score (0-10)
 * @returns Object containing final Tukin score and predicate
 */
export function calculateFinalTukinScore(
  workResultRating: string,
  behaviorRating: string,
  timelinessScore: number
): {
  finalScore: number;
  predicate: string;
  workResultComponent: number;
  behaviorComponent: number;
  timelinessComponent: number;
  tukinPercentage: number;
} {
  // Component weights: SKP 50% + Timeliness 10% = 60% for work performance
  const workResultWeight = 0.5;
  const timelinessWeight = 0.1;
  const behaviorWeight = 0.4;

  // Base score mapping based on ratings
  const getBaseScore = (rating: string): number => {
    switch (rating) {
      case 'Diatas ekspektasi': return 90;
      case 'Sesuai Ekspektasi': return 75;
      case 'Dibawah ekspektasi': return 60;
      default: return 50;
    }
  };

  const workResultBaseScore = getBaseScore(workResultRating);
  const behaviorBaseScore = getBaseScore(behaviorRating);

  // Calculate components
  const workResultComponent = workResultBaseScore * workResultWeight;
  const timelinessComponent = (timelinessScore * 10) * timelinessWeight; // Convert 0-10 to 0-100 then apply weight
  const behaviorComponent = behaviorBaseScore * behaviorWeight;

  // Calculate final score (0-100)
  const finalScore = workResultComponent + timelinessComponent + behaviorComponent;

  // Determine Tukin percentage based on combination matrix
  let tukinPercentage = 0;
  let predicate = '';

  if (workResultRating === 'Diatas ekspektasi' && behaviorRating === 'Diatas ekspektasi') {
    tukinPercentage = 50;
    predicate = 'Sangat Baik';
  } else if (workResultRating === 'Diatas ekspektasi' && behaviorRating === 'Sesuai Ekspektasi') {
    tukinPercentage = 50;
    predicate = 'Baik';
  } else if (workResultRating === 'Sesuai Ekspektasi' && behaviorRating === 'Sesuai Ekspektasi') {
    tukinPercentage = 50;
    predicate = 'Baik';
  } else if (workResultRating === 'Dibawah ekspektasi' && behaviorRating === 'Diatas ekspektasi') {
    tukinPercentage = 35;
    predicate = 'Butuh Perbaikan';
  } else if (workResultRating === 'Dibawah ekspektasi' && behaviorRating === 'Sesuai Ekspektasi') {
    tukinPercentage = 35;
    predicate = 'Butuh Perbaikan';
  } else if (workResultRating === 'Diatas ekspektasi' && behaviorRating === 'Dibawah ekspektasi') {
    tukinPercentage = 20;
    predicate = 'Kurang/Misconduct';
  } else if (workResultRating === 'Sesuai Ekspektasi' && behaviorRating === 'Dibawah ekspektasi') {
    tukinPercentage = 20;
    predicate = 'Kurang/Misconduct';
  } else if (workResultRating === 'Dibawah ekspektasi' && behaviorRating === 'Dibawah ekspektasi') {
    tukinPercentage = 0;
    predicate = 'Sangat Kurang';
  }

  return {
    finalScore: Math.round(finalScore * 10) / 10,
    predicate,
    workResultComponent: Math.round(workResultComponent * 10) / 10,
    behaviorComponent: Math.round(behaviorComponent * 10) / 10,
    timelinessComponent: Math.round(timelinessComponent * 10) / 10,
    tukinPercentage
  };
}

/**
 * Calculate comprehensive monthly SKP score with all components
 * 
 * @param entries - SKP monthly entries
 * @param behaviors - Behavior assessments
 * @param aiAnalysisScore - AI analysis score (0-100)
 * @param selectedMonth - Selected month
 * @param selectedYear - Selected year
 * @returns Comprehensive monthly SKP score calculation
 */
export function calculateMonthlySkpScore(
  entries: Array<{
    supporting_data_submission_date?: string | null;
    deadline?: Date;
    status: string;
  }>,
  behaviors: Array<{
    assessment_score?: number | null;
  }>,
  aiAnalysisScore: number,
  selectedMonth: number,
  selectedYear: number
): {
  workResult: ReturnType<typeof calculateSkpWorkResultScore>;
  behavior: ReturnType<typeof calculateBehaviorScore>;
  timeliness: ReturnType<typeof calculateAverageTukinScore>;
  finalTukin: ReturnType<typeof calculateFinalTukinScore>;
  detailedBreakdown: {
    skpComponent: number;
    timelinessComponent: number;
    behaviorComponent: number;
    totalScore: number;
  };
} {
  // Calculate work result score from AI analysis
  const workResult = calculateSkpWorkResultScore(aiAnalysisScore);
  
  // Calculate behavior score from assessments
  const avgBehaviorScore = behaviors.length > 0 
    ? behaviors.reduce((sum, b) => sum + (b.assessment_score || 3), 0) / behaviors.length
    : 3;
  const behavior = calculateBehaviorScore(avgBehaviorScore);
  
  // Calculate timeliness score
  const timeliness = calculateAverageTukinScore(entries);
  
  // Calculate final Tukin score
  const finalTukin = calculateFinalTukinScore(
    workResult.workResultRating,
    behavior.behaviorRating,
    timeliness.averageScore
  );
  
  // Detailed breakdown
  const detailedBreakdown = {
    skpComponent: finalTukin.workResultComponent,
    timelinessComponent: finalTukin.timelinessComponent,
    behaviorComponent: finalTukin.behaviorComponent,
    totalScore: finalTukin.finalScore
  };

  return {
    workResult,
    behavior,
    timeliness,
    finalTukin,
    detailedBreakdown
  };
}