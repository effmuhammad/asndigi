"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Edit, Trash2, Brain, Loader2, Calendar, AlertTriangle } from "lucide-react"
import { calculateDeadline, formatDeadline, isDeadlinePassed, getDaysUntilDeadline, isSubmissionLate } from "@/lib/deadline-utils"
import { calculateTukinScore, calculateAverageTukinScore, generateSubmissionAnalysis, generateDeepAnalysis, calculateMonthlySkpScore } from '@/lib/tukin-scoring';

interface SkpMonthlyEntry {
  id: string
  sequence_number: number
  month: number
  year: number
  indicator: string
  action_plan: string
  target_realization: string
  supporting_data?: string
  supporting_data_submission_date?: string
  feedback?: string
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
  deadline?: Date // Calculated deadline field
  user: {
    name: string
    nip: string
  }
  supervisor?: {
    name: string
  }
  files: SkpMonthlyFile[]
  created_at: string
  updated_at: string
}

interface SkpMonthlyFile {
  id: string
  file_name: string
  original_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_at: string
}

interface SkpMonthlyBehavior {
  id: string
  month: number
  year: number
  behavior: string
  feedback: string
  behavior_category?: string
  assessment_score?: number
  improvement_notes?: string
  user: {
    name: string
    nip: string
  }
  supervisor?: {
    name: string
  }
  created_by_user: {
    name: string
  }
  created_at: string
  updated_at: string
}

interface BehaviorFormData {
  month: number
  year: number
  behavior: string
  feedback: string
}

interface FormData {
  month: number
  year: number
  indicator: string
  actionPlan: string
  targetRealization: string
  supportingData: string
}

interface SkpSummaryResponse {
  summary: string
  analysis: {
    achievements: string[]
    challenges: string[]
    recommendations: string[]
  }

}

interface AiSummaryData {
  employee: {
    name: string
    nip: string
  }
  period: string
  total_entries: number
  summary: SkpSummaryResponse
  generated_at: string
}

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" }
]

export default function SkpBulananPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<SkpMonthlyEntry[]>([])
  const [behaviors, setBehaviors] = useState<SkpMonthlyBehavior[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBehaviorLoading, setIsBehaviorLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBehaviorDialogOpen, setIsBehaviorDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<SkpMonthlyEntry | null>(null)
  const [editingBehavior, setEditingBehavior] = useState<SkpMonthlyBehavior | null>(null)
  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedMonth, setSelectedMonth] = useState(9)
  const [activeTab, setActiveTab] = useState("kinerja")
  const [aiSummary, setAiSummary] = useState<AiSummaryData | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [showAiSummary, setShowAiSummary] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [showKinerjaAnalysis, setShowKinerjaAnalysis] = useState(false)
  const [showPerilakuAnalysis, setShowPerilakuAnalysis] = useState(false)
  const [isGeneratingKinerjaAnalysis, setIsGeneratingKinerjaAnalysis] = useState(false)
  const [isGeneratingPerilakuAnalysis, setIsGeneratingPerilakuAnalysis] = useState(false)
  const [deepAnalysis, setDeepAnalysis] = useState<any>(null)
  const [isGeneratingDeepAnalysis, setIsGeneratingDeepAnalysis] = useState(false)
  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false)
  const [monthlySkpScore, setMonthlySkpScore] = useState<ReturnType<typeof calculateMonthlySkpScore> | null>(null)
  const [isCalculatingMonthlyScore, setIsCalculatingMonthlyScore] = useState(false)
  const [showMonthlyScore, setShowMonthlyScore] = useState(false)
  const [aiAnalysisScore, setAiAnalysisScore] = useState(75) // Default AI analysis score
  const [formData, setFormData] = useState({
    month: 9,
    year: 2025,
    indicator: "",
    actionPlan: "",
    targetRealization: "",
    supportingData: ""
  })
  const [behaviorFormData, setBehaviorFormData] = useState({
    month: 9,
    year: 2025,
    behavior: "",
    feedback: ""
  })

  // Force refresh data (bypass cache)
  const refreshData = () => {
    if (session?.user?.id) {
      const cacheKey = `${session.user.id}-${selectedYear}-${selectedMonth}`
      // Clear cache for current user and year
      setEntriesCache(prev => {
        const newCache = { ...prev }
        delete newCache[cacheKey]
        return newCache
      })
      setBehaviorsCache(prev => {
        const newCache = { ...prev }
        delete newCache[cacheKey]
        return newCache
      })
      // Reload data
      loadEntries()
      loadBehaviors()
      // Update refresh timestamp
      setLastRefreshTime(new Date())
    }
  }

  // Cache for storing loaded data
  const [entriesCache, setEntriesCache] = useState<{ [key: string]: SkpMonthlyEntry[] }>({})
  const [behaviorsCache, setBehaviorsCache] = useState<{ [key: string]: SkpMonthlyBehavior[] }>({})

  // Load data when session or year changes - with caching
  useEffect(() => {
    if (session?.user?.id) {
      const cacheKey = `${session.user.id}-${selectedYear}-${selectedMonth}`
      
      // Check if we have cached data for this user and year
      if (entriesCache[cacheKey]) {
        setEntries(entriesCache[cacheKey])
        setIsLoading(false)
        // Set refresh time from cached data if not already set
        if (!lastRefreshTime) {
          setLastRefreshTime(new Date())
        }
      } else {
        loadEntries()
      }
      
      if (behaviorsCache[cacheKey]) {
        setBehaviors(behaviorsCache[cacheKey])
        setIsBehaviorLoading(false)
        // Set refresh time from cached data if not already set
        if (!lastRefreshTime) {
          setLastRefreshTime(new Date())
        }
      } else {
        loadBehaviors()
      }
    }
  }, [selectedYear, selectedMonth, session?.user?.id]) // Add session.user.id to dependencies to ensure proper loading

  // Load entries from API with caching
  const loadEntries = async () => {
    if (!session?.user?.id) {
      console.log("Session not available, skipping entries load")
      return
    }
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/skp/monthly?year=${selectedYear}&month=${selectedMonth}`)
      if (response.ok) {
        const data = await response.json()
        // Add deadline calculation to each entry
        const entriesWithDeadlines = (data.data || []).map((entry: SkpMonthlyEntry) => ({
          ...entry,
          deadline: calculateDeadline(entry.year, entry.month)
        }))
        
        // Cache the data
        const cacheKey = `${session.user.id}-${selectedYear}-${selectedMonth}`
        setEntriesCache(prev => ({ ...prev, [cacheKey]: entriesWithDeadlines }))
        
        setEntries(entriesWithDeadlines)
        setLastRefreshTime(new Date()) // Set refresh time when data is loaded
      } else {
        toast.error("Gagal memuat data SKP")
      }
    } catch (error) {
      console.error("Error loading entries:", error)
      toast.error("Terjadi kesalahan saat memuat data")
    } finally {
      setIsLoading(false)
    }
  }

  // Load behaviors from API with caching
  const loadBehaviors = async () => {
    if (!session?.user?.id) {
      console.log("Session not available, skipping behaviors load")
      return
    }
    
    try {
      setIsBehaviorLoading(true)
      const response = await fetch(`/api/skp/monthly/behavior?year=${selectedYear}&month=${selectedMonth}`)
      if (response.ok) {
        const data = await response.json()
        const behaviorsData = data.data || []
        
        // Cache the data
        const cacheKey = `${session.user.id}-${selectedYear}-${selectedMonth}`
        setBehaviorsCache(prev => ({ ...prev, [cacheKey]: behaviorsData }))
        
        setBehaviors(behaviorsData)
        setLastRefreshTime(new Date()) // Set refresh time when data is loaded
      } else {
        toast.error("Gagal memuat data perilaku")
      }
    } catch (error) {
      console.error("Error loading behaviors:", error)
      toast.error("Terjadi kesalahan saat memuat data perilaku")
    } finally {
      setIsBehaviorLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingEntry ? `/api/skp/monthly/${editingEntry.id}` : '/api/skp/monthly'
      const method = editingEntry ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: formData.month,
          year: formData.year,
          indicator: formData.indicator,
          actionPlan: formData.actionPlan,
          targetRealization: formData.targetRealization,
          supportingData: formData.supportingData || undefined
        })
      })

      if (response.ok) {
        toast.success(editingEntry ? "SKP berhasil diperbarui" : "SKP berhasil ditambahkan")
        setIsDialogOpen(false)
        resetForm()
        refreshData() // Use refresh to clear cache and reload
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal menyimpan data")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Terjadi kesalahan saat menyimpan data")
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return

    try {
      const response = await fetch(`/api/skp/monthly/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("SKP berhasil dihapus")
        refreshData() // Use refresh to clear cache and reload
      } else {
        toast.error("Gagal menghapus data")
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
      toast.error("Terjadi kesalahan saat menghapus data")
    }
  }

  // Handle edit
  const handleEdit = (entry: SkpMonthlyEntry) => {
    setEditingEntry(entry)
    setFormData({
      month: entry.month,
      year: entry.year,
      indicator: entry.indicator,
      actionPlan: entry.action_plan,
      targetRealization: entry.target_realization,
      supportingData: entry.supporting_data || ""
    })
    setIsDialogOpen(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      month: 9,
      year: 2025,
      indicator: "",
      actionPlan: "",
      targetRealization: "",
      supportingData: ""
    })
    setEditingEntry(null)
  }

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  // Generate AI analysis for Kinerja (Performance) section
  const generateKinerjaAnalysis = async () => {
    setIsGeneratingKinerjaAnalysis(true)
    
    try {
      // Simulate AI analysis generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Use the new deep analysis function for comprehensive insights
      const deepAnalysis = generateDeepAnalysis(entries, behaviors, selectedMonth, selectedYear)
      setDeepAnalysis(deepAnalysis)
      
      // Also generate the basic analysis for backward compatibility
      const basicAnalysis = generateSubmissionAnalysis(entries)
      
      console.log('Deep Kinerja Analysis:', deepAnalysis)
      console.log('Basic Kinerja Analysis:', basicAnalysis)
      
      toast.success('Analisis AI mendalam untuk kinerja berhasil dibuat')
      setShowKinerjaAnalysis(true)
      setShowDeepAnalysis(true)
    } catch (error) {
      console.error('Error generating kinerja analysis:', error)
      toast.error('Gagal membuat analisis kinerja')
    } finally {
      setIsGeneratingKinerjaAnalysis(false)
    }
  }

  // Calculate AI score based on current data
  const calculateAiScoreFromData = (): number => {
    if (entries.length === 0) return 75 // Default neutral score for no data
    
    // Calculate submission performance metrics
    const submittedEntries = entries.filter(entry => entry.supporting_data_submission_date).length
    const submissionRate = (submittedEntries / entries.length) * 100
    
    // Calculate on-time submission rate
    const onTimeEntries = entries.filter(entry => {
      if (!entry.supporting_data_submission_date) return false
      const submissionDate = new Date(entry.supporting_data_submission_date)
      const deadline = entry.deadline || calculateDeadline(entry.month, entry.year)
      return submissionDate <= deadline
    }).length
    
    const onTimeRate = (onTimeEntries / entries.length) * 100
    
    // Calculate completion quality
    const completedEntries = entries.filter(entry => 
      entry.target_realization && entry.target_realization.length > 10
    ).length
    const completionRate = (completedEntries / entries.length) * 100
    
    // Calculate behavior quality if available
    let behaviorScore = 3 // Default neutral behavior score
    if (behaviors.length > 0) {
      behaviorScore = behaviors.reduce((sum, behavior) => {
        return sum + (behavior.assessment_score || 3)
      }, 0) / behaviors.length
    }
    
    // Calculate base AI score using weighted formula
    let baseScore = 75
    
    // Submission rate weight: 40%
    if (submissionRate >= 95) baseScore += 10
    else if (submissionRate >= 90) baseScore += 8
    else if (submissionRate >= 85) baseScore += 6
    else if (submissionRate >= 80) baseScore += 4
    else if (submissionRate >= 75) baseScore += 2
    else if (submissionRate >= 70) baseScore += 0
    else if (submissionRate >= 60) baseScore -= 3
    else baseScore -= 5
    
    // On-time rate weight: 30%
    if (onTimeRate >= 90) baseScore += 8
    else if (onTimeRate >= 80) baseScore += 6
    else if (onTimeRate >= 70) baseScore += 4
    else if (onTimeRate >= 60) baseScore += 2
    else if (onTimeRate >= 50) baseScore += 0
    else if (onTimeRate >= 40) baseScore -= 3
    else baseScore -= 5
    
    // Completion quality weight: 20%
    if (completionRate >= 95) baseScore += 5
    else if (completionRate >= 90) baseScore += 4
    else if (completionRate >= 85) baseScore += 3
    else if (completionRate >= 80) baseScore += 2
    else if (completionRate >= 75) baseScore += 1
    else if (completionRate >= 70) baseScore += 0
    else if (completionRate >= 60) baseScore -= 2
    else baseScore -= 3
    
    // Behavior score weight: 10%
    const behaviorAdjustment = (behaviorScore - 3) * 3.33 // Scale 1-5 to -6.66 to +6.66
    baseScore += behaviorAdjustment
    
    // Ensure score stays within reasonable bounds (50-100)
    return Math.max(50, Math.min(100, Math.round(baseScore)))
  }

  // Calculate monthly SKP score
  const calculateMonthlySkpScoreDisplay = async () => {
    setIsCalculatingMonthlyScore(true)
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Calculate AI score based on actual data using objective formula
      const calculatedAiScore = calculateAiScoreFromData()
      
      // Update the AI analysis score with calculated value
      setAiAnalysisScore(calculatedAiScore)
      
      // Calculate comprehensive monthly SKP score
      const monthlyScore = calculateMonthlySkpScore(
        entries,
        behaviors,
        calculatedAiScore,
        selectedMonth,
        selectedYear
      )
      
      setMonthlySkpScore(monthlyScore)
      setShowMonthlyScore(true)
      
      console.log('Monthly SKP Score:', monthlyScore)
      console.log('Calculated AI Score:', calculatedAiScore)
      toast.success('Perhitungan Nilai SKP Bulanan berhasil dilakukan')
    } catch (error) {
      console.error('Error calculating monthly SKP score:', error)
      toast.error('Gagal menghitung nilai SKP bulanan')
    } finally {
      setIsCalculatingMonthlyScore(false)
    }
  }

  // Generate AI analysis for Perilaku (Behavior) section
  const generatePerilakuAnalysis = async () => {
    setIsGeneratingPerilakuAnalysis(true)
    
    try {
      // Simulate AI analysis generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For behavior analysis, we'll use a simplified version
      const analysis = {
        pattern: `Analisis pola perilaku untuk ${behaviors.length} data perilaku`,
        insights: [
          `Total data perilaku: ${behaviors.length}`,
          `Rentang waktu: ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`,
          'Analisis mendalam memerlukan data historis yang lebih lengkap'
        ],
        recommendations: [
          'Lakukan evaluasi perilaku secara berkala',
          'Dokumentasikan perubahan perilaku dari waktu ke waktu',
          'Gunakan feedback untuk perbaikan berkelanjutan'
        ],
        trend: behaviors.length > 0 ? 'Data Tersedia' : 'Belum Ada Data'
      }
      
      console.log('Perilaku Analysis:', analysis)
      
      toast.success('Analisis AI untuk perilaku berhasil dibuat')
      setShowPerilakuAnalysis(true)
    } catch (error) {
      console.error('Error generating perilaku analysis:', error)
      toast.error('Gagal membuat analisis perilaku')
    } finally {
      setIsGeneratingPerilakuAnalysis(false)
    }
  }

  // Behavior form functions
  const handleBehaviorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingBehavior ? `/api/skp/monthly/behavior/${editingBehavior.id}` : '/api/skp/monthly/behavior'
      const method = editingBehavior ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: behaviorFormData.month,
          year: behaviorFormData.year,
          behavior: behaviorFormData.behavior,
          feedback: behaviorFormData.feedback
        })
      })

      if (response.ok) {
        toast.success(editingBehavior ? "Data perilaku berhasil diperbarui" : "Data perilaku berhasil ditambahkan")
        setIsBehaviorDialogOpen(false)
        resetBehaviorForm()
        refreshData() // Use refresh to clear cache and reload
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal menyimpan data perilaku")
      }
    } catch (error) {
      console.error("Error submitting behavior form:", error)
      toast.error("Terjadi kesalahan saat menyimpan data perilaku")
    }
  }

  const handleBehaviorDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data perilaku ini?")) return

    try {
      const response = await fetch(`/api/skp/monthly/behavior/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Data perilaku berhasil dihapus")
        refreshData() // Use refresh to clear cache and reload
      } else {
        toast.error("Gagal menghapus data perilaku")
      }
    } catch (error) {
      console.error("Error deleting behavior:", error)
      toast.error("Terjadi kesalahan saat menghapus data perilaku")
    }
  }

  const handleBehaviorEdit = (behavior: SkpMonthlyBehavior) => {
    setEditingBehavior(behavior)
    setBehaviorFormData({
      month: behavior.month,
      year: behavior.year,
      behavior: behavior.behavior,
      feedback: behavior.feedback
    })
    setIsBehaviorDialogOpen(true)
  }

  const resetBehaviorForm = () => {
    setBehaviorFormData({
      month: 9,
      year: 2025,
      behavior: "",
      feedback: ""
    })
    setEditingBehavior(null)
  }

  const handleBehaviorDialogClose = () => {
    setIsBehaviorDialogOpen(false)
    resetBehaviorForm()
  }

  // Generate years for selection
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  // Generate AI Summary
  const generateAiSummary = async () => {
    try {
      setIsGeneratingSummary(true)
      const response = await fetch('/api/skp/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          year: selectedYear
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiSummary(data.data)
        setShowAiSummary(true)
        
        // Calculate AI analysis score based on actual performance data
        if (data.data && data.data.summary) {
          // Calculate based on actual data instead of just text analysis
          let aiScore = 75 // Default neutral score
          
          // Calculate submission performance
          if (entries.length > 0) {
            const submittedEntries = entries.filter(entry => entry.supporting_data_submission_date).length
            const submissionRate = (submittedEntries / entries.length) * 100
            
            // Calculate on-time submission rate
            const onTimeEntries = entries.filter(entry => {
              if (!entry.supporting_data_submission_date) return false
              const submissionDate = new Date(entry.supporting_data_submission_date)
              const deadline = entry.deadline || calculateDeadline(entry.month, entry.year)
              return submissionDate <= deadline
            }).length
            
            const onTimeRate = (onTimeEntries / entries.length) * 100
            
            // Base score on submission performance
            if (submissionRate >= 95 && onTimeRate >= 90) aiScore = 95
            else if (submissionRate >= 90 && onTimeRate >= 80) aiScore = 90
            else if (submissionRate >= 85 && onTimeRate >= 70) aiScore = 85
            else if (submissionRate >= 80 && onTimeRate >= 60) aiScore = 80
            else if (submissionRate >= 75 && onTimeRate >= 50) aiScore = 75
            else if (submissionRate >= 70) aiScore = 70
            else aiScore = 65
            
            // Adjust based on summary content as secondary factor
            const summary = data.data.summary
            if (summary.includes('sangat baik') || summary.includes('di atas ekspektasi')) {
              aiScore = Math.min(95, aiScore + 5)
            } else if (summary.includes('baik') || summary.includes('sesuai ekspektasi')) {
              aiScore = Math.min(90, aiScore + 3)
            } else if (summary.includes('perlu perbaikan') || summary.includes('di bawah ekspektasi')) {
              aiScore = Math.max(60, aiScore - 5)
            } else if (summary.includes('kurang') || summary.includes('misconduct')) {
              aiScore = Math.max(50, aiScore - 10)
            }
            
            // Ensure score stays within reasonable bounds
            aiScore = Math.max(50, Math.min(95, aiScore))
          }
          
          setAiAnalysisScore(aiScore)
        }
        
        toast.success("Ringkasan AI berhasil dibuat")
      } else {
        const error = await response.json()
        toast.error(error.error || "Gagal membuat ringkasan AI")
      }
    } catch (error) {
      console.error("Error generating AI summary:", error)
      toast.error("Terjadi kesalahan saat membuat ringkasan AI")
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sasaran Kinerja Pegawai</h1>
          <p className="text-muted-foreground">
            Kelola data Sasaran Kerja Pegawai (SKP) bulanan Anda
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* <Button 
            variant="outline" 
            onClick={generateAiSummary}
            disabled={isGeneratingSummary || entries.length === 0}
          >
            {isGeneratingSummary ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {isGeneratingSummary ? "Membuat Ringkasan..." : "Ringkasan AI"}
          </Button> */}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? "Edit Sasaran Kinerja Pegawai" : "Tambah Sasaran Kinerja Pegawai"}
                </DialogTitle>
                <DialogDescription>
                  {editingEntry ? "Perbarui data Sasaran Kinerja Pegawai" : "Tambahkan data Sasaran Kinerja Pegawai baru"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Bulan</Label>
                    <Select
                      value={formData.month.toString()}
                      onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="year">Tahun</Label>
                    <Select
                      value={formData.year.toString()}
                      onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indicator">Indikator</Label>
                  <Input
                    id="indicator"
                    value={formData.indicator}
                    onChange={(e) => setFormData({ ...formData, indicator: e.target.value })}
                    placeholder="Masukkan indikator kinerja"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionPlan">Rencana Aksi</Label>
                  <Textarea
                    id="actionPlan"
                    value={formData.actionPlan}
                    onChange={(e) => setFormData({ ...formData, actionPlan: e.target.value })}
                    placeholder="Masukkan rencana aksi"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetRealization">Realisasi Target</Label>
                  <Textarea
                    id="targetRealization"
                    value={formData.targetRealization}
                    onChange={(e) => setFormData({ ...formData, targetRealization: e.target.value })}
                    placeholder="Masukkan realisasi target"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportingData">Bukti Data Dukung</Label>
                  <Textarea
                    id="supportingData"
                    value={formData.supportingData}
                    onChange={(e) => setFormData({ ...formData, supportingData: e.target.value })}
                    placeholder="Masukkan data dukung"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingEntry ? "Perbarui" : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isBehaviorDialogOpen} onOpenChange={setIsBehaviorDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingBehavior ? "Edit Data Perilaku" : "Tambah Data Perilaku"}
                </DialogTitle>
                <DialogDescription>
                  {editingBehavior ? "Perbarui data perilaku pegawai" : "Tambahkan data perilaku pegawai baru"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleBehaviorSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Bulan</Label>
                    <Select
                      value={behaviorFormData.month.toString()}
                      onValueChange={(value) => setBehaviorFormData({ ...behaviorFormData, month: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="year">Tahun</Label>
                    <Select
                      value={behaviorFormData.year.toString()}
                      onValueChange={(value) => setBehaviorFormData({ ...behaviorFormData, year: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="behavior">Perilaku</Label>
                  <Textarea
                    id="behavior"
                    placeholder="Masukkan deskripsi perilaku..."
                    value={behaviorFormData.behavior}
                    onChange={(e) => setBehaviorFormData({ ...behaviorFormData, behavior: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Masukkan feedback..."
                    value={behaviorFormData.feedback}
                    onChange={(e) => setBehaviorFormData({ ...behaviorFormData, feedback: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleBehaviorDialogClose}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingBehavior ? "Perbarui" : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Summary Card */}
      {showAiSummary && aiSummary && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">Ringkasan AI - Kinerja SKP</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAiSummary(false)}
              >
                ×
              </Button>
            </div>
            <CardDescription className="text-blue-700">
              {aiSummary.period} • {aiSummary.total_entries} entri SKP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Executive Summary */}
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Ringkasan Eksekutif</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                {aiSummary.summary.summary}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Achievements */}
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Pencapaian
                </h4>
                <ul className="space-y-1">
                  {aiSummary.summary.analysis.achievements.map((achievement, index) => (
                    <li key={index} className="text-sm text-green-700 pl-4 relative">
                      <span className="absolute left-0 top-2 w-1 h-1 bg-green-400 rounded-full"></span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Challenges */}
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-700 flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Tantangan
                </h4>
                <ul className="space-y-1">
                  {aiSummary.summary.analysis.challenges.map((challenge, index) => (
                    <li key={index} className="text-sm text-orange-700 pl-4 relative">
                      <span className="absolute left-0 top-2 w-1 h-1 bg-orange-400 rounded-full"></span>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-700 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Rekomendasi
                </h4>
                <ul className="space-y-1">
                  {aiSummary.summary.analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-purple-700 pl-4 relative">
                      <span className="absolute left-0 top-2 w-1 h-1 bg-purple-400 rounded-full"></span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>



            <div className="text-xs text-blue-600 text-right">
              Dibuat pada: {new Date(aiSummary.generated_at).toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly SKP Score Calculation Card */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Perhitungan Nilai SKP Bulanan</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={calculateMonthlySkpScoreDisplay}
                disabled={isCalculatingMonthlyScore || entries.length === 0 || behaviors.length === 0}
                variant="outline"
                size="sm"
              >
                {isCalculatingMonthlyScore ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                {isCalculatingMonthlyScore ? "Menghitung..." : "Hitung Nilai SKP"}
              </Button>
              {showMonthlyScore && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowMonthlyScore(false)}
                >
                  ×
                </Button>
              )}
            </div>
          </div>
          <CardDescription className="text-green-700">
                Perhitungan Nilai SKP Bulanan berdasarkan Unsur Prestasi Kerja (SKP + Ketepatan Waktu Laporan)
               
              </CardDescription>
        </CardHeader>
        {showMonthlyScore && monthlySkpScore && (
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-purple-200 bg-purple-50">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{monthlySkpScore.finalTukin.tukinPercentage}%</div>
                  <div className="text-sm text-gray-600">Persentase Tukin</div>
                  <div className="text-xs text-purple-600 mt-1">
                    SKP: {monthlySkpScore.workResult.workResultRating}
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-orange-200 bg-orange-50">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{monthlySkpScore.timeliness.averageScore}%</div>
                  <div className="text-sm text-gray-600">Skor Ketepatan Waktu</div>
                  <div className="text-xs text-orange-600 mt-1">
                    {monthlySkpScore.timeliness.submittedEntries}/{monthlySkpScore.timeliness.totalEntries} laporan
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-green-200 bg-green-50">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{monthlySkpScore.finalTukin.tukinPercentage + monthlySkpScore.timeliness.averageScore}%</div>
                  <div className="text-sm text-gray-600">Skor Total</div>
                  <div className="text-xs text-green-600 mt-1">
                    Tukin + Ketepatan Waktu
                  </div>
                </div>
              </Card>
            </div>

            {/* Insights and Development Recommendations */}
            {monthlySkpScore && (
              <div className="space-y-6 mt-6">
                {/* Development Recommendations */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Rekomendasi Pengembangan Kinerja
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Strategi untuk meningkatkan performa SKP bulanan berikutnya
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-green-800 flex items-center gap-2">
                          <span className="bg-green-100 px-2 py-1 rounded text-xs">Jangka Pendek</span>
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {monthlySkpScore.timeliness.averageScore < 80 && (
                            <>
                              <li className="flex items-start gap-2">
                                <span className="text-green-500">→</span>
                                <span>Buat pengingat deadline 3 hari sebelum batas waktu</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-green-500">→</span>
                                <span>Siapkan template laporan untuk mempercepat proses</span>
                              </li>
                            </>
                          )}
                          {monthlySkpScore.workResult.workResultRating === 'Cukup' && (
                            <li className="flex items-start gap-2">
                              <span className="text-green-500">→</span>
                              <span>Review ulang target yang belum tercapai dan buat action plan korektif</span>
                            </li>
                          )}
                          <li className="flex items-start gap-2">
                            <span className="text-green-500">→</span>
                            <span>Lakukan evaluasi mingguan terhadap progress pencapaian target</span>
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-green-800 flex items-center gap-2">
                          <span className="bg-yellow-100 px-2 py-1 rounded text-xs">Jangka Menengah</span>
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-green-500">→</span>
                            <span>Ikuti pelatihan pengelolaan waktu dan manajemen tugas</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500">→</span>
                            <span>Kembangkan sistem dokumentasi yang lebih efisien</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500">→</span>
                            <span>Bangun komunikasi yang lebih intensif dengan atasan untuk feedback berkala</span>
                          </li>
                          {monthlySkpScore.timeliness.submittedEntries < monthlySkpScore.timeliness.totalEntries && (
                            <li className="flex items-start gap-2">
                              <span className="text-green-500">→</span>
                              <span>Identifikasi penyebab keterlambatan dan buat SOP pengumpulan data</span>
                            </li>
                          )}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-green-800 flex items-center gap-2">
                          <span className="bg-blue-100 px-2 py-1 rounded text-xs">Jangka Panjang</span>
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-green-500">→</span>
                            <span>Targetkan peningkatan skor SKP ke level berikutnya dalam 3-6 bulan</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500">→</span>
                            <span>Kembangkan kompetensi teknis sesuai bidang pekerjaan</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500">→</span>
                            <span>bangun portofolio pencapaian untuk penilaian kinerja tahunan</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500">→</span>
                            <span>Rencanakan program pengembangan diri yang terstruktur</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </CardContent>
        )}
      </Card>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="kinerja">Kinerja</TabsTrigger>
          <TabsTrigger value="perilaku">Perilaku</TabsTrigger>
        </TabsList>
        
        {/* Kinerja Tab */}
        <TabsContent value="kinerja">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tabel Rencana dan Realisasi</CardTitle>
                  <CardDescription>
                    SKP {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="yearFilter">Tahun:</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label htmlFor="monthFilter">Bulan:</Label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Memuat data...</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada data Sasaran Kinerja Pegawai untuk {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">No.</TableHead>
                        <TableHead>Indikator</TableHead>
                        <TableHead>Rencana Aksi</TableHead>
                        <TableHead>Realisasi Target</TableHead>
                        <TableHead>Bukti Data Dukung</TableHead>
                        <TableHead>Tanggal Pengumpulan</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead className="w-32">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries
                        .sort((a, b) => a.month - b.month)
                        .reduce((acc, entry, index, sortedEntries) => {
                          const currentMonth = entry.month;
                          const prevMonth = index > 0 ? sortedEntries[index - 1].month : null;
                          
                          // Add month header if it's a new month
                          if (currentMonth !== prevMonth) {
                            const monthLabel = MONTHS.find(m => m.value === currentMonth)?.label;
                            acc.push(
                              <TableRow key={`month-header-${currentMonth}`} className="bg-muted/50">
                                <TableCell colSpan={8} className="font-semibold text-center py-3">
                                  {monthLabel} (Bulan {currentMonth})
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          // Add the actual data row
                          acc.push(
                            <TableRow key={entry.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="min-w-48">
                                <div className="whitespace-normal break-words">
                                  {entry.indicator}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-48">
                                <div className="whitespace-normal break-words">
                                  {entry.action_plan}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-48">
                                <div className="whitespace-normal break-words">
                                  {entry.target_realization}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-32">
                                <div className="flex flex-col space-y-2">
                                  {entry.supporting_data && (
                                    <div className="whitespace-normal break-words text-sm">
                                      {entry.supporting_data}
                                    </div>
                                  )}
                                  {entry.files.length > 0 && (
                                    <Badge variant="secondary" className="text-xs w-fit">
                                      {entry.files.length} file
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-32">
                                {entry.supporting_data_submission_date ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="text-sm">
                                      {new Date(entry.supporting_data_submission_date).toLocaleDateString('id-ID')}
                                    </div>
                                    {entry.deadline && (() => {
                                      const scoreResult = calculateTukinScore(entry.supporting_data_submission_date, entry.deadline);
                                      return (
                                        <div className="flex flex-col gap-1">
                                          {isSubmissionLate(entry.supporting_data_submission_date, entry.deadline) ? (
                                            <div className="flex items-center gap-1 text-red-600">
                                              <AlertTriangle className="h-3 w-3" />
                                              <span className="text-xs font-medium">Terlewat</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1 text-green-600">
                                              <Calendar className="h-3 w-3" />
                                              <span className="text-xs font-medium">Tepat Waktu</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="min-w-32">
                                {entry.feedback ? (
                                  <div className="whitespace-normal break-words text-sm">
                                    {entry.feedback}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(entry)}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(entry.id)}
                                    title="Hapus"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                          
                          return acc;
                        }, [] as React.ReactElement[])}
                    </TableBody>
                  </Table>
                </div>
              )}
              
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Perilaku Tab */}
        <TabsContent value="perilaku">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tabel Data Perilaku</CardTitle>
                  <CardDescription>
                    Data perilaku pegawai {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="yearFilterBehavior">Tahun:</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label htmlFor="monthFilterBehavior">Bulan:</Label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isBehaviorLoading ? (
                <div className="text-center py-8">
                  <p>Memuat data perilaku...</p>
                </div>
              ) : behaviors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada data perilaku untuk {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">No.</TableHead>
                        <TableHead>Perilaku</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead className="w-32">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {behaviors
                        .sort((a, b) => a.month - b.month)
                        .reduce((acc, behavior, index, sortedBehaviors) => {
                          const currentMonth = behavior.month;
                          const prevMonth = index > 0 ? sortedBehaviors[index - 1].month : null;
                          
                          // Add month header if it's a new month
                          if (currentMonth !== prevMonth) {
                            const monthLabel = MONTHS.find(m => m.value === currentMonth)?.label;
                            acc.push(
                              <TableRow key={`month-header-${currentMonth}`} className="bg-muted/50">
                                <TableCell colSpan={4} className="font-semibold text-center py-3">
                                  {monthLabel} (Bulan {currentMonth})
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          // Add the actual data row
                          acc.push(
                            <TableRow key={behavior.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="min-w-48">
                                <div className="whitespace-normal break-words">
                                  {behavior.behavior}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-48">
                                <div className="whitespace-normal break-words">
                                  {behavior.feedback}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBehaviorEdit(behavior)}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBehaviorDelete(behavior.id)}
                                    title="Hapus"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                          
                          return acc;
                        }, [] as React.ReactElement[])}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Analysis Section for Perilaku - Removed as requested */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}