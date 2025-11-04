/**
 * AI Performance Calculation Utilities
 * Functions for calculating average predicates, PAK conversion, and career recommendations
 */

export type PerformancePredicate = "SANGAT_BAIK" | "BAIK" | "CUKUP" | "KURANG" | "SANGAT_KURANG";
export type WorkRating = "DIATAS_EKSPEKTASI" | "SESUAI_EKSPEKTASI" | "DIBAWAH_EKSPEKTASI";

export interface MonthlyPerformance {
  month: number;
  predicate: PerformancePredicate;
  work_rating: WorkRating;
  behavior_rating: WorkRating;
}

export interface AIAnalysisResult {
  averagePredicate: PerformancePredicate;
  predicateScore: number;
  pakConversion: number; // Percentage for JF conversion
  careerRecommendation: string;
  developmentAreas: string[];
  strengths: string[];
  evidenceBasedPolicy: string;
  supervisorFeedback: string;
}

// Predicate scoring system
const PREDICATE_SCORES: Record<PerformancePredicate, number> = {
  "SANGAT_BAIK": 5,
  "BAIK": 4,
  "CUKUP": 3,
  "KURANG": 2,
  "SANGAT_KURANG": 1
};

// PAK Conversion rates based on BKN No. 3 Tahun 2023
const PAK_CONVERSION_RATES: Record<PerformancePredicate, number> = {
  "SANGAT_BAIK": 1.50, // 150%
  "BAIK": 1.00,        // 100%
  "CUKUP": 0.75,       // 75%
  "KURANG": 0.50,      // 50%
  "SANGAT_KURANG": 0.25 // 25%
};

/**
 * Calculate average predicate from monthly performance data
 */
export function calculateAveragePredicate(monthlyData: MonthlyPerformance[]): PerformancePredicate {
  if (monthlyData.length === 0) return "CUKUP";

  const totalScore = monthlyData.reduce((sum, month) => {
    return sum + PREDICATE_SCORES[month.predicate];
  }, 0);

  const averageScore = totalScore / monthlyData.length;

  // Round to nearest integer and map back to predicate
  const roundedScore = Math.round(averageScore);
  
  switch (roundedScore) {
    case 5:
      return "SANGAT_BAIK";
    case 4:
      return "BAIK";
    case 3:
      return "CUKUP";
    case 2:
      return "KURANG";
    case 1:
      return "SANGAT_KURANG";
    default:
      return averageScore >= 4.5 ? "SANGAT_BAIK" : 
             averageScore >= 3.5 ? "BAIK" :
             averageScore >= 2.5 ? "CUKUP" :
             averageScore >= 1.5 ? "KURANG" : "SANGAT_KURANG";
  }
}

/**
 * Convert predicate to PAK value for Jabatan Fungsional
 * Formula: PAK = ConversionRate × (months/12) × baseScore
 */
export function calculatePAKValue(
  predicate: PerformancePredicate,
  monthsActive: number,
  baseScore: number
): number {
  const conversionRate = PAK_CONVERSION_RATES[predicate];
  const timeProportion = monthsActive / 12;
  
  return conversionRate * timeProportion * baseScore;
}

/**
 * Generate career development recommendations based on performance
 */
export function generateCareerRecommendation(
  predicate: PerformancePredicate,
  workRating: WorkRating,
  behaviorRating: WorkRating
): string {
  const recommendations = {
    "SANGAT_BAIK": {
      work_above: "Kinerja Anda sangat luar biasa! Pertimbangkan untuk mengikuti program pengembangan kepemimpinan atau sertifikasi profesional untuk meningkatkan kompetensi. Anda siap untuk promosi ke posisi yang lebih strategis.",
      work_meet: "Kinerja Anda sangat baik! Fokus pada inovasi dan penciptaan nilai tambah untuk organisasi. Pertimbangkan menjadi mentor bagi rekan kerja.",
      work_below: "Meskipun predikat sangat baik, ada ruang untuk peningkatan dalam hasil kerja. Fokus pada efisiensi dan kualitas output untuk mencapai hasil yang lebih optimal."
    },
    "BAIK": {
      work_above: "Kinerja Anda baik dengan hasil kerja di atas ekspektasi. Tingkatkan konsistensi dan eksplorasi potensi untuk mencapai predikat sangat baik.",
      work_meet: "Kinerja Anda stabil dan memenuhi ekspektasi. Identifikasi area untuk inovasi dan pengembangan diri untuk mencapai level berikutnya.",
      work_below: "Fokus pada peningkatan kualitas dan kuantitas hasil kerja. Tetapkan target yang lebih menantang dan kembangkan strategi pencapaian yang lebih efektif."
    },
    "CUKUP": {
      work_above: "Hasil kerja Anda di atas ekspektasi namun perlu peningkatan konsistensi. Fokus pada kompetensi inti dan pengembangan keahlian spesifik.",
      work_meet: "Kinerja Anda memenuhi standar minimal. Tetapkan rencana pengembangan kompetensi untuk mencapai level baik dalam periode berikutnya.",
      work_below: "Perlu perbaikan signifikan dalam hasil kerja. Segera konsultasikan dengan atasan untuk menyusun rencana perbaikan kinerja yang komprehensif."
    },
    "KURANG": {
      work_above: "Meskipun hasil kerja di atas ekspektasi, predikat kurang menunjukkan adanya kesenjangan. Evaluasi metode kerja dan fokus pada peningkatan konsistensi.",
      work_meet: "Kinerja di bawah standar. Segera lakukan evaluasi menyeluruh terhadap metode kerja, kompetensi, dan faktor pendukung lainnya.",
      work_below: "Kinerja memerlukan perhatian serius. Segera konsultasikan dengan atasan untuk menyusun program peningkatan kinerja intensif."
    },
    "SANGAT_KURANG": {
      work_above: "Hasil kerja bagus namun ada masalah fundamental yang perlu diselesaikan. Segera lakukan evaluasi komprehensif dengan atasan.",
      work_meet: "Kinerja sangat memerlukan perbaikan. Segera konsultasikan dengan atasan dan tim HR untuk program peningkatan kinerja.",
      work_below: "Kinerja kritis. Segera lakukan evaluasi menyeluruh dan konsultasi intensif dengan atasan untuk menyusun rencana aksi korektif."
    }
  };

  const workKey = workRating === "DIATAS_EKSPEKTASI" ? "work_above" :
                  workRating === "SESUAI_EKSPEKTASI" ? "work_meet" : "work_below";

  return recommendations[predicate][workKey as keyof typeof recommendations[typeof predicate]];
}

/**
 * Generate evidence-based policy recommendations
 */
export function generateEvidenceBasedPolicy(
  predicate: PerformancePredicate,
  attendancePercentage: number,
  skpPercentage: number,
  workRating: WorkRating,
  behaviorRating: WorkRating
): string {
  const evidence = [];
  
  // Attendance evidence
  if (attendancePercentage >= 95) {
    evidence.push(`Kehadiran sangat baik (${attendancePercentage}%) menunjukkan komitmen tinggi`);
  } else if (attendancePercentage >= 90) {
    evidence.push(`Kehadiran baik (${attendancePercentage}%) dalam kategori memenuhi standar`);
  } else {
    evidence.push(`Kehadiran perlu perhatian (${attendancePercentage}%) untuk optimalisasi kinerja`);
  }

  // SKP evidence
  if (skpPercentage >= 100) {
    evidence.push(`Target SKP tercapai penuh (${skpPercentage}%) menunjukkan efektivitas kerja`);
  } else if (skpPercentage >= 80) {
    evidence.push(`Target SKP sebagian besar tercapai (${skpPercentage}%)`);
  } else {
    evidence.push(`Target SKP perlu perhatian (${skpPercentage}%) untuk peningkatan`);
  }

  // Rating evidence
  if (workRating === "DIATAS_EKSPEKTASI") {
    evidence.push("Hasil kerja melebihi target organisasi");
  }
  
  if (behaviorRating === "DIATAS_EKSPEKTASI") {
    evidence.push("Perilaku kerja menjadi teladan bagi rekan kerja");
  }

  // Policy recommendations based on predicate
  const policies = {
    "SANGAT_BAIK": "Berdasarkan bukti kinerja yang sangat baik, pertimbangkan untuk: 1) Pemberian penghargaan kinerja, 2) Peluang promosi jabatan, 3) Menjadi mentor bagi pegawai lain, 4) Tugas khusus strategis organisasi.",
    "BAIK": "Berdasarkan bukti kinerja yang baik, rekomendasikan: 1) Program pengembangan kompetensi lanjutan, 2) Pemberian tugas-tugas menantang, 3) Partisipasi dalam proyek strategis, 4) Pelatihan kepemimpinan untuk kesiapan promosi.",
    "CUKUP": "Berdasarkan bukti kinerja yang cukup, diperlukan: 1) Rencana pengembangan kompetensi komprehensif, 2) Pembimbingan intensif dari atasan, 3) Pelatihan teknis sesuai kebutuhan, 4) Evaluasi berkala setiap 3 bulan.",
    "KURANG": "Berdasarkan bukti kinerja yang kurang, segera lakukan: 1) Program perbaikan kinerja intensif, 2) Konseling dan coaching, 3) Pelatihan dasar kompetensi inti, 4) Monitoring harian oleh atasan langsung.",
    "SANGAT_KURANG": "Berdasarkan bukti kinerja yang sangat kurang, tindakan segera: 1) Evaluasi komprehensif oleh tim HR, 2) Program remedial kinerja, 3) Konsultasi dengan psikolog industri, 4) Pertimbangan rotasi atau mutasi jabatan."
  };

  return `${evidence.join('. ')}. ${policies[predicate]}`;
}

/**
 * Generate supervisor feedback recommendations
 */
export function generateSupervisorFeedback(
  predicate: PerformancePredicate,
  strengths: string[],
  developmentAreas: string[]
): string {
  const feedback = {
    "SANGAT_BAIK": {
      intro: "Pegawai ini merupakan aset berharga organisasi. Terus berikan tantangan dan peluang pengembangan.",
      action: "Pertahankan momentum kinerja dengan: delegasi otoritas, pengakuan publik, dan peluang karier."
    },
    "BAIK": {
      intro: "Pegawai menunjukkan kinerja yang konsisten dengan potensi untuk berkembang lebih tinggi.",
      action: "Dorong peningkatan melalui: target yang lebih menantang, pelatihan spesifik, dan mentoring."
    },
    "CUKUP": {
      intro: "Perlu perhatian dan dukungan untuk meningkatkan kinerja ke level yang diharapkan.",
      action: "Berikan perhatian khusus melalui: supervisi intensif, pelatihan kompetensi, dan motivasi."
    },
    "KURANG": {
      intro: "Kinerja memerlukan perbaikan signifikan dengan pendekatan yang terstruktur dan terukur.",
      action: "Segera lakukan: evaluasi kinerja formal, program perbaikan, dan monitoring ketat."
    },
    "SANGAT_KURANG": {
      intro: "Kinerja kritis yang memerlukan tindakan korektif segera dan komprehensif.",
      action: "Langkah segera: evaluasi mendalam, konsultasi HR, dan rencana aksi korektif detail."
    }
  };

  const currentFeedback = feedback[predicate];
  
  return `${currentFeedback.intro} Kekuatan: ${strengths.join(', ')}. Area pengembangan: ${developmentAreas.join(', ')}. ${currentFeedback.action}`;
}

/**
 * Main AI analysis function that combines all calculations
 */
export function performAIAnalysis(
  monthlyData: MonthlyPerformance[],
  attendancePercentage: number,
  skpPercentage: number,
  monthsActive: number,
  baseScore: number,
  userPosition: string
): AIAnalysisResult {
  const averagePredicate = calculateAveragePredicate(monthlyData);
  const predicateScore = PREDICATE_SCORES[averagePredicate];
  
  // Only calculate PAK for Jabatan Fungsional
  const isJF = userPosition.toLowerCase().includes('fungsional') || 
               userPosition.toLowerCase().includes('jf') ||
               userPosition.toLowerCase().includes('tenaga');
  
  const pakConversion = isJF ? calculatePAKValue(averagePredicate, monthsActive, baseScore) : 0;

  // Get latest ratings for recommendation
  const latestMonth = monthlyData[monthlyData.length - 1];
  const workRating = latestMonth?.work_rating || "SESUAI_EKSPEKTASI";
  const behaviorRating = latestMonth?.behavior_rating || "SESUAI_EKSPEKTASI";

  // Generate recommendations
  const careerRecommendation = generateCareerRecommendation(averagePredicate, workRating, behaviorRating);
  const evidenceBasedPolicy = generateEvidenceBasedPolicy(
    averagePredicate, attendancePercentage, skpPercentage, workRating, behaviorRating
  );

  // Generate strengths and development areas
  const strengths = generateStrengths(averagePredicate, workRating, behaviorRating);
  const developmentAreas = generateDevelopmentAreas(averagePredicate, workRating, behaviorRating);
  const supervisorFeedback = generateSupervisorFeedback(averagePredicate, strengths, developmentAreas);

  return {
    averagePredicate,
    predicateScore,
    pakConversion,
    careerRecommendation,
    developmentAreas,
    strengths,
    evidenceBasedPolicy,
    supervisorFeedback
  };
}

/**
 * Generate strengths based on performance
 */
function generateStrengths(
  predicate: PerformancePredicate,
  workRating: WorkRating,
  behaviorRating: WorkRating
): string[] {
  const strengths = [];

  if (predicate === "SANGAT_BAIK" || predicate === "BAIK") {
    strengths.push("Konsistensi kinerja tinggi");
  }

  if (workRating === "DIATAS_EKSPEKTASI") {
    strengths.push("Mampu melebihi target kerja");
  }

  if (behaviorRating === "DIATAS_EKSPEKTASI") {
    strengths.push("Perilaku profesional sebagai teladan");
  }

  if (predicate === "SANGAT_BAIK") {
    strengths.push("Ekselensi dalam pencapaian");
  }

  return strengths.length > 0 ? strengths : ["Dedikasi terhadap pekerjaan"];
}

/**
 * Generate development areas based on performance
 */
function generateDevelopmentAreas(
  predicate: PerformancePredicate,
  workRating: WorkRating,
  behaviorRating: WorkRating
): string[] {
  const areas = [];

  if (predicate === "CUKUP" || predicate === "KURANG" || predicate === "SANGAT_KURANG") {
    areas.push("Peningkatan kompetensi teknis");
  }

  if (workRating === "DIBAWAH_EKSPEKTASI") {
    areas.push("Optimalisasi hasil kerja");
  }

  if (behaviorRating === "DIBAWAH_EKSPEKTASI") {
    areas.push("Penguatan soft skills dan kerja sama");
  }

  if (predicate === "BAIK") {
    areas.push("Inovasi dan kreativitas untuk level berikutnya");
  }

  return areas.length > 0 ? areas : ["Pengembangan diri berkelanjutan"];
}