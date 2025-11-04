import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Function to calculate random submission date within 1-6 working days of the following month
function calculateRandomSubmissionDate(taskYear: number, taskMonth: number): Date {
  // Get the last day of the task month
  const lastDayOfTaskMonth = new Date(taskYear, taskMonth, 0)
  
  // Start from the first day of the following month
  let currentDate = new Date(lastDayOfTaskMonth)
  currentDate.setDate(currentDate.getDate() + 1)
  
  let workingDaysAdded = 0
  const workingDays: Date[] = []
  
  // Collect first 6 working days of the following month
  while (workingDaysAdded < 6) {
    const dayOfWeek = currentDate.getDay() // 0 = Sunday, 6 = Saturday
    
    // If it's not a weekend, count it as a working day
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays.push(new Date(currentDate))
      workingDaysAdded++
    }
    
    // Always move to next day to continue searching
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Return a random working day from the first 6 working days
  const randomIndex = Math.floor(Math.random() * workingDays.length)
  return workingDays[randomIndex]
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data in correct order (respecting foreign key constraints)
  await prisma.digitalSignature.deleteMany()
  await prisma.supervisorEvaluation.deleteMany()
  await prisma.annualPerformanceReport.deleteMany()
  await prisma.organizationalPerformanceReport.deleteMany()
  await prisma.trainingRecord.deleteMany()
  await prisma.skHistory.deleteMany()
  await prisma.skpMonthlyFile.deleteMany()
  await prisma.skpMonthlyEntry.deleteMany()
  await prisma.approval.deleteMany()
  await prisma.performanceReport.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.workSettings.deleteMany()
  await prisma.user.deleteMany()

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10)
  const supervisorPassword = await bcrypt.hash('supervisor123', 10)
  const staffPassword = await bcrypt.hash('staff123', 10)

  // 1. Create Users with hierarchy
  console.log('👥 Creating users...')
  
  // Admin user
  const admin = await prisma.user.create({
    data: {
      nip: '199001012020121001',
      name: 'Dr. Budi Santoso, M.Si',
      email: 'budi.santoso@kemenhub.go.id',
      password: adminPassword,
      role: 'ADMIN',
      work_unit: 'Sekretariat Jenderal',
      position: 'Kepala Biro Kepegawaian',
      grade: 'IV/a',
      employment_status: 'PNS'
    }
  })

  // Supervisor users
  const supervisor1 = await prisma.user.create({
    data: {
      nip: '199002022021121002',
      name: 'Dra. Siti Nurhaliza, M.M',
      email: 'siti.nurhaliza@kemenhub.go.id',
      password: supervisorPassword,
      role: 'SUPERVISOR',
      work_unit: 'Direktorat Jenderal Perhubungan Darat',
      position: 'Kepala Subdirektorat',
      grade: 'III/d',
      employment_status: 'PNS'
    }
  })

  const supervisor2 = await prisma.user.create({
    data: {
      nip: '199003032022121003',
      name: 'Ir. Ahmad Wijaya, M.T',
      email: 'ahmad.wijaya@kemenhub.go.id',
      password: supervisorPassword,
      role: 'SUPERVISOR',
      work_unit: 'Direktorat Jenderal Perhubungan Laut',
      position: 'Kepala Bagian Teknis',
      grade: 'III/c',
      employment_status: 'PNS'
    }
  })

  // Staff users
  const staff1 = await prisma.user.create({
    data: {
      nip: '199004042023121004',
      name: 'Andi Pratama, S.Kom',
      email: 'andi.pratama@kemenhub.go.id',
      password: staffPassword,
      role: 'STAFF',
      work_unit: 'Direktorat Jenderal Perhubungan Darat',
      position: 'Analis Sistem Informasi',
      grade: 'III/a',
      employment_status: 'PNS',
      supervisor_id: supervisor1.id
    }
  })

  const staff2 = await prisma.user.create({
    data: {
      nip: '199005052025121005',
      name: 'Maya Sari, S.E',
      email: 'maya.sari@kemenhub.go.id',
      password: staffPassword,
      role: 'STAFF',
      work_unit: 'Direktorat Jenderal Perhubungan Darat',
      position: 'Analis Keuangan',
      grade: 'II/d',
      employment_status: 'PPPK',
      supervisor_id: supervisor1.id
    }
  })

  const staff3 = await prisma.user.create({
    data: {
      nip: '199006062025121006',
      name: 'Rizki Firmansyah, S.T',
      email: 'rizki.firmansyah@kemenhub.go.id',
      password: staffPassword,
      role: 'STAFF',
      work_unit: 'Direktorat Jenderal Perhubungan Laut',
      position: 'Teknisi Pelabuhan',
      grade: 'III/b',
      employment_status: 'PNS',
      supervisor_id: supervisor2.id
    }
  })

  // 2. Create Profiles for all users
  console.log('📋 Creating profiles...')
  
  const adminProfile = await prisma.profile.create({
    data: {
      user_id: admin.id,
      full_name: 'Dr. Budi Santoso, M.Si',
      birth_place: 'Jakarta',
      birth_date: new Date('1990-01-01'),
      gender: 'Laki-laki',
      religion: 'Islam',
      marital_status: 'Menikah',
      address: 'Jl. Merdeka No. 123, Jakarta Pusat',
      phone: '081234567890',
      emergency_contact: 'Siti Budi (Istri)',
      emergency_phone: '081234567891',
      education_level: 'S3',
      education_institution: 'Universitas Indonesia',
      education_major: 'Administrasi Publik',
      education_year: 2018,
      employment_start_date: new Date('2020-01-01'),
      years_of_service: 4,
      skills: JSON.stringify(['Manajemen', 'Kepemimpinan', 'Analisis Kebijakan'])
    }
  })

  const supervisor1Profile = await prisma.profile.create({
    data: {
      user_id: supervisor1.id,
      full_name: 'Dra. Siti Nurhaliza, M.M',
      birth_place: 'Bandung',
      birth_date: new Date('1990-02-02'),
      gender: 'Perempuan',
      religion: 'Islam',
      marital_status: 'Menikah',
      address: 'Jl. Sudirman No. 456, Bandung',
      phone: '081234567892',
      emergency_contact: 'Ahmad Nurhaliza (Suami)',
      emergency_phone: '081234567893',
      education_level: 'S2',
      education_institution: 'Institut Teknologi Bandung',
      education_major: 'Manajemen',
      education_year: 2015,
      employment_start_date: new Date('2021-01-01'),
      years_of_service: 3,
      skills: JSON.stringify(['Manajemen Proyek', 'Analisis Data', 'Komunikasi'])
    }
  })

  const supervisor2Profile = await prisma.profile.create({
    data: {
      user_id: supervisor2.id,
      full_name: 'Ir. Ahmad Wijaya, M.T',
      birth_place: 'Surabaya',
      birth_date: new Date('1990-03-03'),
      gender: 'Laki-laki',
      religion: 'Islam',
      marital_status: 'Menikah',
      address: 'Jl. Thamrin No. 789, Surabaya',
      phone: '081234567894',
      emergency_contact: 'Dewi Wijaya (Istri)',
      emergency_phone: '081234567895',
      education_level: 'S2',
      education_institution: 'Institut Teknologi Sepuluh Nopember',
      education_major: 'Teknik Sipil',
      education_year: 2016,
      employment_start_date: new Date('2022-01-01'),
      years_of_service: 2,
      skills: JSON.stringify(['Teknik Sipil', 'Manajemen Konstruksi', 'AutoCAD'])
    }
  })

  const staff1Profile = await prisma.profile.create({
    data: {
      user_id: staff1.id,
      full_name: 'Andi Pratama, S.Kom',
      birth_place: 'Makassar',
      birth_date: new Date('1990-04-04'),
      gender: 'Laki-laki',
      religion: 'Islam',
      marital_status: 'Belum Menikah',
      address: 'Jl. Gatot Subroto No. 101, Makassar',
      phone: '081234567896',
      emergency_contact: 'Hasan Pratama (Ayah)',
      emergency_phone: '081234567897',
      education_level: 'S1',
      education_institution: 'Universitas Hasanuddin',
      education_major: 'Sistem Informasi',
      education_year: 2020,
      employment_start_date: new Date('2023-01-01'),
      years_of_service: 1,
      skills: JSON.stringify(['Programming', 'Database', 'Web Development'])
    }
  })

  const staff2Profile = await prisma.profile.create({
    data: {
      user_id: staff2.id,
      full_name: 'Maya Sari, S.E',
      birth_place: 'Medan',
      birth_date: new Date('1990-05-05'),
      gender: 'Perempuan',
      religion: 'Kristen',
      marital_status: 'Menikah',
      address: 'Jl. Ahmad Yani No. 202, Medan',
      phone: '081234567898',
      emergency_contact: 'Budi Sari (Suami)',
      emergency_phone: '081234567899',
      education_level: 'S1',
      education_institution: 'Universitas Sumatera Utara',
      education_major: 'Ekonomi',
      education_year: 2019,
      employment_start_date: new Date('2025-01-01'),
      years_of_service: 0,
      skills: JSON.stringify(['Akuntansi', 'Analisis Keuangan', 'Excel'])
    }
  })

  const staff3Profile = await prisma.profile.create({
    data: {
      user_id: staff3.id,
      full_name: 'Rizki Firmansyah, S.T',
      birth_place: 'Palembang',
      birth_date: new Date('1990-06-06'),
      gender: 'Laki-laki',
      religion: 'Islam',
      marital_status: 'Menikah',
      address: 'Jl. Diponegoro No. 303, Palembang',
      phone: '081234567800',
      emergency_contact: 'Sari Firmansyah (Istri)',
      emergency_phone: '081234567801',
      education_level: 'S1',
      education_institution: 'Universitas Sriwijaya',
      education_major: 'Teknik Sipil',
      education_year: 2018,
      employment_start_date: new Date('2025-01-01'),
      years_of_service: 0,
      skills: JSON.stringify(['Teknik Sipil', 'Survei', 'Konstruksi'])
    }
  })

  // 3. Create SK History records
  console.log('📜 Creating SK history records...')
  
  await prisma.skHistory.createMany({
    data: [
      {
        profile_id: adminProfile.id,
        sk_number: 'SK.001/KP/2020',
        sk_type: 'PENGANGKATAN',
        position: 'Kepala Biro Kepegawaian',
        unit: 'Sekretariat Jenderal',
        effective_date: new Date('2020-01-01'),
        description: 'Pengangkatan sebagai Kepala Biro Kepegawaian'
      },
      {
        profile_id: supervisor1Profile.id,
        sk_number: 'SK.002/KP/2021',
        sk_type: 'PENGANGKATAN',
        position: 'Kepala Subdirektorat',
        unit: 'Direktorat Jenderal Perhubungan Darat',
        effective_date: new Date('2021-01-01'),
        description: 'Pengangkatan sebagai Kepala Subdirektorat'
      },
      {
        profile_id: supervisor1Profile.id,
        sk_number: 'SK.003/KP/2023',
        sk_type: 'PROMOSI',
        position: 'Kepala Subdirektorat',
        unit: 'Direktorat Jenderal Perhubungan Darat',
        effective_date: new Date('2023-01-01'),
        description: 'Promosi ke golongan III/d'
      },
      {
        profile_id: supervisor2Profile.id,
        sk_number: 'SK.004/KP/2022',
        sk_type: 'MUTASI',
        position: 'Kepala Bagian Teknis',
        unit: 'Direktorat Jenderal Perhubungan Laut',
        effective_date: new Date('2022-01-01'),
        description: 'Mutasi dari Direktorat Perhubungan Darat'
      },
      {
        profile_id: staff1Profile.id,
        sk_number: 'SK.005/KP/2023',
        sk_type: 'PENGANGKATAN',
        position: 'Analis Sistem Informasi',
        unit: 'Direktorat Jenderal Perhubungan Darat',
        effective_date: new Date('2023-01-01'),
        description: 'Pengangkatan sebagai PNS'
      }
    ]
  })

  // 4. Create Training Records
  console.log('🎓 Creating training records...')
  
  await prisma.trainingRecord.createMany({
    data: [
      {
        profile_id: adminProfile.id,
        training_name: 'Pelatihan Kepemimpinan Nasional',
        category: 'KEPEMIMPINAN',
        organizer: 'LAN RI',
        start_date: new Date('2023-01-15'),
        end_date: new Date('2023-01-20'),
        duration_hours: 40,
        description: 'Pelatihan kepemimpinan untuk pejabat eselon II'
      },
      {
        profile_id: adminProfile.id,
        training_name: 'Workshop Manajemen Kinerja ASN',
        category: 'MANAJERIAL',
        organizer: 'Kemenpan RB',
        start_date: new Date('2023-03-10'),
        end_date: new Date('2023-03-12'),
        duration_hours: 24,
        description: 'Workshop tentang sistem manajemen kinerja ASN'
      },
      {
        profile_id: supervisor1Profile.id,
        training_name: 'Pelatihan Manajemen Proyek',
        category: 'MANAJERIAL',
        organizer: 'BPSDM Kemenhub',
        start_date: new Date('2023-02-01'),
        end_date: new Date('2023-02-05'),
        duration_hours: 35,
        description: 'Pelatihan manajemen proyek untuk supervisor'
      },
      {
        profile_id: supervisor2Profile.id,
        training_name: 'Sertifikasi Keselamatan Pelabuhan',
        category: 'TEKNIS',
        organizer: 'Dirjen Hubla',
        start_date: new Date('2023-04-01'),
        end_date: new Date('2023-04-03'),
        duration_hours: 21,
        description: 'Sertifikasi keselamatan dan keamanan pelabuhan'
      },
      {
        profile_id: staff1Profile.id,
        training_name: 'Pelatihan Pengembangan Aplikasi Web',
        category: 'TEKNIS',
        organizer: 'Pusdiklat Kemenhub',
        start_date: new Date('2023-05-15'),
        end_date: new Date('2023-05-19'),
        duration_hours: 35,
        description: 'Pelatihan pengembangan aplikasi web modern'
      },
      {
        profile_id: staff2Profile.id,
        training_name: 'Workshop Analisis Keuangan',
        category: 'FUNGSIONAL',
        organizer: 'BPKP',
        start_date: new Date('2023-06-01'),
        end_date: new Date('2023-06-02'),
        duration_hours: 16,
        description: 'Workshop analisis laporan keuangan'
      }
    ]
  })

  // 5. Create Work Settings
  console.log('⚙️ Creating work settings...')
  
  const workSettings = await prisma.workSettings.create({
    data: {
      work_start_time: '08:00',
      work_end_time: '17:00',
      late_tolerance_minutes: 15,
      is_active: true
    }
  })

  // 6. Create Attendance records
  console.log('📅 Creating attendance records...')
  
  const users = [admin, supervisor1, supervisor2, staff1, staff2, staff3]
  const attendanceData = []
  
  // Create attendance from January 1st to November 2nd (current year) using UTC
  const currentYear = new Date().getFullYear()
  const startDate = new Date(Date.UTC(currentYear, 0, 1)) // January 1st UTC
  const endDate = new Date(Date.UTC(currentYear, 10, 2)) // November 2nd UTC
  
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      for (const user of users) {
        // Random chance for absence (5% chance)
        if (Math.random() < 0.05) {
          continue // Skip this day (absent)
        }
        
        const attendanceDate = new Date(currentDate)
        
        // Check-in time: 07:45 - 08:30 (45 minutes range) to create realistic late scenarios
        const checkInHour = 7
        const checkInMinute = 45 + Math.floor(Math.random() * 46) // 45-90 minutes (07:45-08:30)
        
        // Create check-in time using UTC to avoid timezone issues
        const checkIn = new Date(Date.UTC(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          checkInMinute >= 60 ? checkInHour + 1 : checkInHour,
          checkInMinute >= 60 ? checkInMinute - 60 : checkInMinute,
          Math.floor(Math.random() * 60)
        ))
        
        // Check-out time: 17:00 - 17:30 (30 minutes range)
        const checkOutHour = 17
        const checkOutMinute = Math.floor(Math.random() * 31) // 0-30 minutes (17:00-17:30)
        const checkOut = new Date(Date.UTC(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          checkOutHour,
          checkOutMinute,
          Math.floor(Math.random() * 60)
        ))
        
        // Determine status based on check-in time and tolerance
        let status = 'PRESENT'
        
        // Create a reference time for work start + tolerance (08:00 + 15 minutes = 08:15) using UTC
        const workStartWithTolerance = new Date(Date.UTC(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          8, 15, 0 // 08:15:00 UTC
        ))
        
        // Late if check-in after work start + tolerance
        if (checkIn > workStartWithTolerance) {
          status = 'LATE'
        }
        
        // Early leave if check-out before 17:00 (optional, can be uncommented if needed)
        // if (checkOutHour < 17) {
        //   status = 'EARLY_LEAVE'
        // }
        
        attendanceData.push({
          user_id: user.id,
          attendance_date: attendanceDate,
          check_in: checkIn,
          check_out: checkOut,
          status: status as any,
          location_data: JSON.stringify({
            latitude: -6.2088 + (Math.random() - 0.5) * 0.01,
            longitude: 106.8456 + (Math.random() - 0.5) * 0.01,
            address: 'Kantor Kementerian Perhubungan'
          })
        })
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  await prisma.attendance.createMany({
    data: attendanceData
  })

  // 7. Create Performance Reports and Approvals
  console.log('📊 Creating performance reports...')
  
  const performanceReports = await Promise.all([
    prisma.performanceReport.create({
      data: {
        user_id: staff1.id,
        period_type: 'MONTHLY',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-01-31'),
        attendance_summary: JSON.stringify({
          total_days: 22,
          present: 20,
          late: 1,
          absent: 1
        }),
        skp_summary: JSON.stringify({
          total_targets: 5,
          achieved: 4,
          percentage: 80
        }),
        total_score: 85.5,
        status: 'APPROVED'
      }
    }),
    prisma.performanceReport.create({
      data: {
        user_id: staff2.id,
        period_type: 'MONTHLY',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-01-31'),
        attendance_summary: JSON.stringify({
          total_days: 22,
          present: 21,
          late: 1,
          absent: 0
        }),
        skp_summary: JSON.stringify({
          total_targets: 4,
          achieved: 4,
          percentage: 100
        }),
        total_score: 92.0,
        status: 'SUBMITTED'
      }
    })
  ])

  // Create approvals for performance reports
  await prisma.approval.createMany({
    data: [
      {
        report_id: performanceReports[0].id,
        approver_id: supervisor1.id,
        status: 'APPROVED',
        comments: 'Kinerja baik, perlu peningkatan kedisiplinan',
        approved_at: new Date('2025-02-05')
      },
      {
        report_id: performanceReports[1].id,
        approver_id: supervisor1.id,
        status: 'PENDING',
        comments: null,
        approved_at: null
      }
    ]
  })

  // 8. Create SKP Monthly Entries and Files
  console.log('📋 Creating SKP monthly entries...')
  
  // Define SKP indicators based on CSV data - these are the main indicators that repeat monthly
  const csvSkpIndicators = [
    {
      indicator: 'TERLAKSANANYA PENGOPERASIAN PERAWATAN DAN PERBAIKAN FASILITAS KEAMANAN PENERBANGAN DAN PELAYANAN DARURAT',
      action_plan: 'Terlaksananya kegiatan Menyiapkan dan mengoperasikan peralatan elektronikan penerbangan kategori A',
      target_realization: 'Dokumen',
      supporting_data: 'https://bit.ly/lapbulTU2025'
    },
    {
      indicator: 'TERLAKSANANYA PENGOPERASIAN PERAWATAN DAN PERBAIKAN FASILITAS KEAMANAN PENERBANGAN DAN PELAYANAN DARURAT',
      action_plan: 'Terlaksananya kegiatan pemeliharaan tingkat I peralatan elektronika penerbangan kategori A',
      target_realization: 'Dokumen',
      supporting_data: 'https://bit.ly/lapbulTU2025'
    },
    {
      indicator: 'TERLAKSANANYA PENGOPERASIAN PERAWATAN DAN PERBAIKAN FASILITAS KEAMANAN PENERBANGAN DAN PELAYANAN DARURAT',
      action_plan: 'Terlaksananya kegiatan pemeliharaan tingkat I peralatan elektronika penerbangan kategori C',
      target_realization: 'Dokumen',
      supporting_data: 'https://bit.ly/lapbulTU2025'
    },
    {
      indicator: 'TERLAKSANANYA PENGOPERASIAN PERAWATAN DAN PERBAIKAN FASILITAS KEAMANAN PENERBANGAN DAN PELAYANAN DARURAT',
      action_plan: 'Terlaksananya kegiatan pemeliharaan tingkat II peralatan elektronika penerbangan kategori A',
      target_realization: 'Dokumen',
      supporting_data: 'https://bit.ly/lapbulTU2025'
    },
    {
      indicator: 'TERLAKSANANYA PENGOPERASIAN PERAWATAN DAN PERBAIKAN FASILITAS KEAMANAN PENERBANGAN DAN PELAYANAN DARURAT',
      action_plan: 'Terlaksananya kegiatan pemeliharaan tingkat II peralatan elektronika penerbangan kategori C',
      target_realization: 'Dokumen',
      supporting_data: 'https://bit.ly/lapbulTU2025'
    },
    {
      indicator: 'TERLAKSANANYA PENGOPERASIAN PERAWATAN DAN PERBAIKAN FASILITAS KEAMANAN PENERBANGAN DAN PELAYANAN DARURAT',
      action_plan: 'Terlaksananya kegiatan pemeliharaan tingkat I peralatan elektronika bandara kategori B',
      target_realization: 'Dokumen',
      supporting_data: 'https://bit.ly/lapbulTU2025'
    },
    {
      indicator: 'TERLAKSANANYA EVALUASI DAN PENYUSUNAN LAPORAN KEGIATAN SEKSI TOKPD TERMASUK KEGIATAN KOMITE OPERASIONAL BANDAR UDARA (KEAMANAN DAN KESELAMATAN)',
      action_plan: 'Terlaksananya tugas jaga',
      target_realization: 'Dokumen',
      supporting_data: 'https://bit.ly/lapbulTU2025'
    }
  ]

  // Create SKP entries for all users for January-December 2025
  const skpEntries = []
  const skpUsers = [staff1, staff2, staff3]
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  
  const feedbacks = [
    'Pekerjaan dilaksanakan dengan baik',
    'Target tercapai sesuai rencana',
    'Perlu peningkatan di beberapa aspek',
    'Hasil memuaskan dan tepat waktu',
    'Kualitas kerja sangat baik'
  ]

  for (const user of skpUsers) {
    const supervisorId = user.id === staff3.id ? supervisor2.id : supervisor1.id
    
    for (const month of months) {
      const monthName = monthNames[month - 1]
      
      for (let seqNo = 1; seqNo <= csvSkpIndicators.length; seqNo++) {
        const indicator = csvSkpIndicators[seqNo - 1]
        
        // Determine status based on month:
        // Jan-Sep: APPROVED (submitted with realization and supporting data)
        // Oct-Dec: DRAFT (pending submission, need to meet deadline)
        let status: 'APPROVED' | 'SUBMITTED' | 'DRAFT'
        let feedback: string | null = null
        let supportingData: string | null = null
        let supportingDataSubmissionDate: Date | null = null
        let targetRealization: string
        
        if (month <= 9) {
          // Jan-Sep: Already submitted and approved
          status = 'APPROVED'
          feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)]
          supportingData = indicator.supporting_data
          targetRealization = `${indicator.target_realization} ${monthName}`
          
          // Set submission date for approved entries (1-6 working days in the following month)
          supportingDataSubmissionDate = calculateRandomSubmissionDate(2025, month)
        } else {
          // Oct-Dec: Still in draft, pending submission
          status = 'DRAFT'
          feedback = null
          supportingData = null
          supportingDataSubmissionDate = null
          targetRealization = `${indicator.target_realization} ${monthName}`
        }
        
        const entry = await prisma.skpMonthlyEntry.create({
          data: {
            user_id: user.id,
            month: month,
            year: 2025,
            sequence_no: seqNo,
            indicator: indicator.indicator,
            action_plan: indicator.action_plan,
            target_realization: targetRealization,
            supporting_data: supportingData,
            supporting_data_submission_date: supportingDataSubmissionDate,
            feedback: feedback,
            status: status,
            created_by: user.id,
            supervisor_id: supervisorId
          }
        })
        
        skpEntries.push(entry)
      }
    }
  }

  // Create SKP Monthly Files
  console.log('📄 Creating SKP monthly files...')
  
  // Create sample files for some entries (first 3 entries of each month for demonstration)
  const sampleFiles = []
  for (let i = 0; i < Math.min(36, skpEntries.length); i++) { // 3 files per month for 12 months
    const entry = skpEntries[i]
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthName = monthNames[entry.month - 1]
    
    sampleFiles.push({
      entry_id: entry.id,
      file_name: `skp_${entry.user_id}_${monthName}2025_${entry.sequence_no}.pdf`,
      original_name: `SKP ${monthName} 2025 - Sequence ${entry.sequence_no}.pdf`,
      file_path: `/uploads/skp/skp_${entry.user_id}_${monthName}2025_${entry.sequence_no}.pdf`,
      file_type: 'application/pdf',
      file_size: Math.floor(Math.random() * 2000000) + 500000 // Random size between 500KB - 2.5MB
    })
  }

  await prisma.skpMonthlyFile.createMany({
    data: sampleFiles
  })

  // Create SKP Monthly Behavior Entries
  console.log('🎭 Creating SKP monthly behavior entries...')
  
  // Define behavior data for each user
  const behaviorData = {
    [staff1.id]: [
      {
        behavior: 'Menunjukkan integritas dalam bekerja',
        feedback: 'Selalu jujur dan dapat dipercaya dalam menjalankan tugas',
        behavior_category: 'Integritas',
        assessment_score: 4,
        improvement_notes: 'Pertahankan sikap yang baik'
      },
      {
        behavior: 'Bekerja sama dengan tim secara efektif',
        feedback: 'Aktif berkolaborasi dan membantu rekan kerja',
        behavior_category: 'Kerjasama',
        assessment_score: 5,
        improvement_notes: 'Sangat baik dalam kerjasama tim'
      }
    ],
    [staff2.id]: [
      {
        behavior: 'Disiplin dalam menjalankan tugas',
        feedback: 'Selalu tepat waktu dan mengikuti prosedur yang berlaku',
        behavior_category: 'Disiplin',
        assessment_score: 4,
        improvement_notes: 'Tingkatkan konsistensi kehadiran'
      },
      {
        behavior: 'Menunjukkan komitmen terhadap pelayanan publik',
        feedback: 'Berorientasi pada kepuasan stakeholder',
        behavior_category: 'Pelayanan Publik',
        assessment_score: 4,
        improvement_notes: 'Terus tingkatkan kualitas pelayanan'
      }
    ],
    [staff3.id]: [
      {
        behavior: 'Bertanggung jawab dalam menjalankan tugas',
        feedback: 'Menyelesaikan tugas dengan penuh tanggung jawab',
        behavior_category: 'Tanggung Jawab',
        assessment_score: 4,
        improvement_notes: 'Pertahankan sikap bertanggung jawab'
      },
      {
        behavior: 'Menunjukkan adaptabilitas terhadap perubahan',
        feedback: 'Mampu menyesuaikan diri dengan perubahan prosedur',
        behavior_category: 'Adaptabilitas',
        assessment_score: 3,
        improvement_notes: 'Tingkatkan kemampuan adaptasi'
      }
    ]
  }

  // Create behavior entries for all users for January-December 2025
  const behaviorEntries = []
  
  for (const user of skpUsers) {
    const supervisorId = user.id === staff3.id ? supervisor2.id : supervisor1.id
    
    for (const month of months) {
      const behaviors = behaviorData[user.id]
      
      for (let seqNo = 1; seqNo <= behaviors.length; seqNo++) {
        const behavior = behaviors[seqNo - 1]
        
        // Apply same logic as SKP entries: Jan-Sep approved, Oct-Dec draft
        let status: 'APPROVED' | 'SUBMITTED' | 'DRAFT'
        if (month <= 9) {
          status = 'APPROVED'
        } else {
          status = 'DRAFT'
        }
        
        const entry = await prisma.skpMonthlyBehavior.create({
          data: {
            user_id: user.id,
            month: month,
            year: 2025,
            sequence_no: seqNo,
            behavior: behavior.behavior,
            feedback: behavior.feedback,
            assessment_score: behavior.assessment_score,
            improvement_notes: behavior.improvement_notes,
            status: status,
            created_by: user.id,
            supervisor_id: supervisorId
          }
        })
        
        behaviorEntries.push(entry)
      }
    }
  }

  // 9. Create Annual Performance Reports
  console.log('📊 Creating annual performance reports...')
  
  const annualReports = await Promise.all([
    // Staff 1 - 2023 Report (Approved)
    prisma.annualPerformanceReport.create({
      data: {
        user_id: staff1.id,
        year: 2023,
        attendance_summary: JSON.stringify({
          total_working_days: 250,
          present_days: 235,
          absent_days: 8,
          sick_days: 4,
          leave_days: 3,
          attendance_percentage: 94.0
        }),
        skp_summary: JSON.stringify({
          total_targets: 5,
          completed_targets: 4,
          in_progress_targets: 1,
          completion_percentage: 85.0,
          average_score: 87.5
        }),
        work_result_rating: 'SESUAI_EKSPEKTASI',
        behavior_rating: 'SESUAI_EKSPEKTASI',
        performance_predicate: 'BAIK',
        ai_generated_summary: 'Pegawai menunjukkan kinerja yang konsisten dengan tingkat kehadiran yang baik (94%) dan pencapaian SKP yang memuaskan (85%). Memiliki dedikasi tinggi dalam menyelesaikan tugas-tugas yang diberikan.',
        self_assessment: 'Saya merasa telah memberikan kontribusi yang baik untuk organisasi. Tingkat kehadiran saya konsisten dan saya berhasil menyelesaikan sebagian besar target SKP yang ditetapkan.',
        achievements: 'Berhasil mengimplementasikan sistem informasi baru, meningkatkan efisiensi proses kerja sebesar 20%, dan menyelesaikan 4 dari 5 target SKP dengan baik.',
        challenges: 'Menghadapi kendala dalam koordinasi antar divisi dan keterbatasan waktu untuk menyelesaikan satu target SKP yang kompleks.',
        improvement_plan: 'Akan meningkatkan kemampuan komunikasi dan koordinasi, serta mengikuti pelatihan tambahan untuk meningkatkan keterampilan teknis.',
        status: 'APPROVED',
        submitted_at: new Date('2024-01-15'),
        approved_at: new Date('2024-01-20')
      }
    }),

    // Staff 1 - 2024 Report (Submitted)
    prisma.annualPerformanceReport.create({
      data: {
        user_id: staff1.id,
        year: 2024,
        attendance_summary: JSON.stringify({
          total_working_days: 252,
          present_days: 240,
          absent_days: 6,
          sick_days: 3,
          leave_days: 3,
          attendance_percentage: 95.2
        }),
        skp_summary: JSON.stringify({
          total_targets: 6,
          completed_targets: 5,
          in_progress_targets: 1,
          completion_percentage: 90.0,
          average_score: 89.2
        }),
        work_result_rating: 'SESUAI_EKSPEKTASI',
        behavior_rating: 'DIATAS_EKSPEKTASI',
        performance_predicate: 'BAIK',
        ai_generated_summary: 'Terjadi peningkatan kinerja yang signifikan dibandingkan tahun sebelumnya. Tingkat kehadiran meningkat menjadi 95.2% dan pencapaian SKP mencapai 90%. Menunjukkan perilaku kerja yang sangat baik.',
        self_assessment: 'Tahun ini saya merasa lebih berkembang dan mampu memberikan kontribusi yang lebih besar. Saya berhasil meningkatkan kinerja di berbagai aspek.',
        achievements: 'Memimpin proyek digitalisasi dokumen, meningkatkan produktivitas tim sebesar 25%, dan mencapai 90% target SKP dengan kualitas yang sangat baik.',
        challenges: 'Adaptasi dengan teknologi baru dan mengelola beban kerja yang meningkat akibat tanggung jawab tambahan.',
        improvement_plan: 'Akan mengikuti sertifikasi profesional dan mengembangkan kemampuan kepemimpinan untuk persiapan karir ke jenjang yang lebih tinggi.',
        status: 'SUBMITTED',
        submitted_at: new Date('2025-01-10')
      }
    }),

    // Staff 2 - 2023 Report (Approved)
    prisma.annualPerformanceReport.create({
      data: {
        user_id: staff2.id,
        year: 2023,
        attendance_summary: JSON.stringify({
          total_working_days: 250,
          present_days: 220,
          absent_days: 15,
          sick_days: 8,
          leave_days: 7,
          attendance_percentage: 88.0
        }),
        skp_summary: JSON.stringify({
          total_targets: 4,
          completed_targets: 3,
          in_progress_targets: 1,
          completion_percentage: 80.0,
          average_score: 82.5
        }),
        work_result_rating: 'SESUAI_EKSPEKTASI',
        behavior_rating: 'SESUAI_EKSPEKTASI',
        performance_predicate: 'BAIK',
        ai_generated_summary: 'Kinerja pegawai cukup baik dengan pencapaian SKP 80% dan tingkat kehadiran 88%. Perlu peningkatan dalam hal disiplin kehadiran dan optimalisasi pencapaian target.',
        self_assessment: 'Saya berusaha memberikan yang terbaik meskipun menghadapi beberapa kendala kesehatan. Saya berkomitmen untuk terus meningkatkan kinerja.',
        achievements: 'Berhasil menyelesaikan analisis keuangan tahunan, mengoptimalkan proses budgeting, dan memberikan rekomendasi penghematan anggaran sebesar 15%.',
        challenges: 'Mengalami beberapa masalah kesehatan yang mempengaruhi kehadiran dan kesulitan dalam menggunakan sistem baru.',
        improvement_plan: 'Akan menjaga kesehatan dengan lebih baik, mengikuti pelatihan sistem informasi, dan meningkatkan disiplin kehadiran.',
        status: 'APPROVED',
        submitted_at: new Date('2024-01-18'),
        approved_at: new Date('2024-01-25')
      }
    }),

    // Staff 2 - 2024 Report (Draft)
    prisma.annualPerformanceReport.create({
      data: {
        user_id: staff2.id,
        year: 2024,
        attendance_summary: JSON.stringify({
          total_working_days: 252,
          present_days: 230,
          absent_days: 12,
          sick_days: 5,
          leave_days: 5,
          attendance_percentage: 91.3
        }),
        skp_summary: JSON.stringify({
          total_targets: 5,
          completed_targets: 4,
          in_progress_targets: 1,
          completion_percentage: 85.0,
          average_score: 85.8
        }),
        work_result_rating: 'SESUAI_EKSPEKTASI',
        behavior_rating: 'SESUAI_EKSPEKTASI',
        performance_predicate: 'BAIK',
        self_assessment: 'Tahun ini saya merasa ada peningkatan yang signifikan dalam kinerja saya. Kehadiran lebih baik dan pencapaian target juga meningkat.',
        achievements: 'Mengimplementasikan sistem pelaporan keuangan digital, meningkatkan akurasi laporan sebesar 30%, dan menyelesaikan audit internal tanpa temuan signifikan.',
        challenges: 'Masih menghadapi tantangan dalam hal manajemen waktu dan koordinasi dengan unit kerja lain.',
        improvement_plan: 'Akan mengikuti pelatihan manajemen waktu dan komunikasi efektif untuk meningkatkan koordinasi kerja.',
        status: 'DRAFT'
      }
    }),

    // Staff 3 - 2023 Report (Approved)
    prisma.annualPerformanceReport.create({
      data: {
        user_id: staff3.id,
        year: 2023,
        attendance_summary: JSON.stringify({
          total_working_days: 250,
          present_days: 245,
          absent_days: 3,
          sick_days: 1,
          leave_days: 1,
          attendance_percentage: 98.0
        }),
        skp_summary: JSON.stringify({
          total_targets: 5,
          completed_targets: 5,
          in_progress_targets: 0,
          completion_percentage: 100.0,
          average_score: 92.0
        }),
        work_result_rating: 'DIATAS_EKSPEKTASI',
        behavior_rating: 'DIATAS_EKSPEKTASI',
        performance_predicate: 'SANGAT_BAIK',
        ai_generated_summary: 'Pegawai menunjukkan kinerja yang sangat luar biasa dengan tingkat kehadiran 98% dan pencapaian SKP 100%. Merupakan contoh teladan bagi pegawai lainnya.',
        self_assessment: 'Saya sangat bangga dengan pencapaian tahun ini. Berhasil menyelesaikan semua target dengan kualitas yang tinggi dan selalu hadir tepat waktu.',
        achievements: 'Menyelesaikan 100% target SKP, memimpin proyek modernisasi pelabuhan, meningkatkan efisiensi operasional sebesar 40%, dan meraih penghargaan pegawai terbaik.',
        challenges: 'Tantangan utama adalah mengelola proyek besar sambil mempertahankan kualitas pekerjaan rutin.',
        improvement_plan: 'Akan berbagi pengetahuan dengan rekan kerja melalui mentoring dan mengikuti pelatihan kepemimpinan untuk pengembangan karir.',
        status: 'APPROVED',
        submitted_at: new Date('2024-01-12'),
        approved_at: new Date('2024-01-15')
      }
    }),

    // Staff 3 - 2024 Report (Submitted)
    prisma.annualPerformanceReport.create({
      data: {
        user_id: staff3.id,
        year: 2024,
        attendance_summary: JSON.stringify({
          total_working_days: 252,
          present_days: 248,
          absent_days: 2,
          sick_days: 1,
          leave_days: 1,
          attendance_percentage: 98.4
        }),
        skp_summary: JSON.stringify({
          total_targets: 6,
          completed_targets: 6,
          in_progress_targets: 0,
          completion_percentage: 100.0,
          average_score: 94.5
        }),
        work_result_rating: 'DIATAS_EKSPEKTASI',
        behavior_rating: 'DIATAS_EKSPEKTASI',
        performance_predicate: 'SANGAT_BAIK',
        ai_generated_summary: 'Konsistensi kinerja yang luar biasa dengan peningkatan di semua aspek. Tingkat kehadiran 98.4% dan pencapaian SKP 100% dengan skor rata-rata 94.5. Menunjukkan dedikasi dan profesionalisme tinggi.',
        self_assessment: 'Tahun ini saya berhasil mempertahankan dan bahkan meningkatkan kinerja. Saya merasa semakin berkembang dan siap mengambil tanggung jawab yang lebih besar.',
        achievements: 'Mencapai 100% target SKP dengan skor tertinggi, memimpin implementasi sistem keamanan pelabuhan, mengurangi incident rate sebesar 50%, dan menjadi mentor untuk pegawai baru.',
        challenges: 'Mengelola ekspektasi yang semakin tinggi dan menyeimbangkan peran sebagai teknisi dan mentor.',
        improvement_plan: 'Akan mengambil sertifikasi internasional di bidang keamanan pelabuhan dan mengembangkan program pelatihan untuk tim.',
        status: 'SUBMITTED',
        submitted_at: new Date('2025-01-08')
      }
    })
  ])

  // Create Supervisor Evaluations for approved reports
  console.log('👨‍💼 Creating supervisor evaluations...')
  
  const supervisorEvaluations = await Promise.all([
    // Evaluation for Staff 1 - 2023 Report (by Supervisor 1)
    prisma.supervisorEvaluation.create({
      data: {
        annual_report_id: annualReports[0].id, // Staff 1 - 2023
        supervisor_id: supervisor1.id,
        employee_id: staff1.id,
        work_quality_score: 4,
        work_quantity_score: 4,
        punctuality_score: 5,
        cooperation_score: 4,
        initiative_score: 4,
        leadership_score: 3,
        overall_rating: 4.0,
        supervisor_comments: 'Andi menunjukkan kinerja yang konsisten dan dapat diandalkan. Kualitas pekerjaannya baik dan selalu menyelesaikan tugas tepat waktu. Perlu sedikit peningkatan dalam hal inisiatif dan kepemimpinan.',
        recommendations: 'Disarankan untuk mengikuti pelatihan kepemimpinan dan diberikan tanggung jawab proyek yang lebih besar untuk mengembangkan kemampuan manajerial.',
        development_areas: 'Kepemimpinan, komunikasi strategis, dan pengambilan keputusan dalam situasi kompleks.',
        strengths: 'Disiplin tinggi, keterampilan teknis yang solid, dan kemampuan bekerja dalam tim yang baik.'
      }
    }),

    // Evaluation for Staff 2 - 2023 Report (by Supervisor 1)
    prisma.supervisorEvaluation.create({
      data: {
        annual_report_id: annualReports[2].id, // Staff 2 - 2023
        supervisor_id: supervisor1.id,
        employee_id: staff2.id,
        work_quality_score: 4,
        work_quantity_score: 3,
        punctuality_score: 3,
        cooperation_score: 4,
        initiative_score: 3,
        leadership_score: 3,
        overall_rating: 3.3,
        supervisor_comments: 'Maya memiliki kemampuan analisis yang baik, namun perlu peningkatan dalam hal kedisiplinan kehadiran. Kualitas pekerjaan cukup baik tetapi kuantitas perlu ditingkatkan.',
        recommendations: 'Perlu fokus pada peningkatan disiplin kehadiran dan manajemen waktu. Disarankan mengikuti pelatihan produktivitas kerja.',
        development_areas: 'Manajemen waktu, disiplin kehadiran, dan peningkatan output kerja.',
        strengths: 'Kemampuan analisis keuangan yang baik, teliti dalam bekerja, dan memiliki pemahaman yang mendalam tentang regulasi keuangan.'
      }
    }),

    // Evaluation for Staff 3 - 2023 Report (by Supervisor 2)
    prisma.supervisorEvaluation.create({
      data: {
        annual_report_id: annualReports[4].id, // Staff 3 - 2023
        supervisor_id: supervisor2.id,
        employee_id: staff3.id,
        work_quality_score: 5,
        work_quantity_score: 5,
        punctuality_score: 5,
        cooperation_score: 5,
        initiative_score: 5,
        leadership_score: 4,
        overall_rating: 4.8,
        supervisor_comments: 'Rizki adalah pegawai teladan dengan kinerja yang luar biasa di semua aspek. Selalu proaktif, inovatif, dan menjadi contoh bagi rekan kerja lainnya. Sangat direkomendasikan untuk promosi.',
        recommendations: 'Sangat layak untuk dipromosikan ke posisi yang lebih tinggi. Dapat diberikan tanggung jawab sebagai mentor untuk pegawai junior.',
        development_areas: 'Pengembangan kemampuan strategis dan manajemen organisasi untuk persiapan posisi kepemimpinan.',
        strengths: 'Kinerja luar biasa di semua aspek, kepemimpinan natural, inovasi tinggi, dan dedikasi yang sangat baik.'
      }
    })
  ])

  // Create Digital Signatures for approved reports
  console.log('🔐 Creating digital signatures...')
  
  const digitalSignatures = await Promise.all([
    // Digital Signature for Staff 1 - 2023 Report
    prisma.digitalSignature.create({
      data: {
        annual_report_id: annualReports[0].id, // Staff 1 - 2023
        signer_id: supervisor1.id,
        signature_data: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRyYS4gU2l0aSBOdXJoYWxpemEsIE0uTSIsImlhdCI6MTUxNjIzOTAyMn0.signature_hash_staff1_2023',
        signature_timestamp: new Date('2024-01-20T10:30:00'),
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        status: 'SIGNED',
        verification_code: 'SIGN-2024-001-APPROVED'
      }
    }),

    // Digital Signature for Staff 2 - 2023 Report
    prisma.digitalSignature.create({
      data: {
        annual_report_id: annualReports[2].id, // Staff 2 - 2023
        signer_id: supervisor1.id,
        signature_data: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRyYS4gU2l0aSBOdXJoYWxpemEsIE0uTSIsImlhdCI6MTUxNjIzOTAyMn0.signature_hash_staff2_2023',
        signature_timestamp: new Date('2024-01-25T14:15:00'),
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        status: 'SIGNED',
        verification_code: 'SIGN-2024-002-APPROVED'
      }
    }),

    // Digital Signature for Staff 3 - 2023 Report
    prisma.digitalSignature.create({
      data: {
        annual_report_id: annualReports[4].id, // Staff 3 - 2023
        signer_id: supervisor2.id,
        signature_data: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IklyLiBBaG1hZCBXaWpheWEsIE0uVCIsImlhdCI6MTUxNjIzOTAyMn0.signature_hash_staff3_2023',
        signature_timestamp: new Date('2024-01-15T16:45:00'),
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        status: 'SIGNED',
        verification_code: 'SIGN-2024-003-APPROVED'
      }
    })
  ])

  console.log('✅ Database seeding completed successfully!')

  // 10. Create Organizational Performance Reports
  console.log('🏢 Creating organizational performance reports...')
  
  const organizationalReports = await Promise.all([
    prisma.organizationalPerformanceReport.create({
      data: {
        year: 2023,
        total_employees: 6,
        average_attendance_rate: 88.5,
        average_skp_progress: 85.0,
        overall_performance_score: 86.75,
        predicate: 'BAIK',
        summary: 'Kinerja organisasi tahun 2023 menunjukkan tren positif dengan tingkat kehadiran yang baik dan pencapaian SKP yang memuaskan. Sebagian besar pegawai mampu mencapai target yang ditetapkan.',
        recommendations: 'Perlu peningkatan disiplin kehadiran dan optimalisasi pencapaian target SKP. Disarankan untuk mengadakan pelatihan tambahan dan monitoring yang lebih intensif.',
        created_by: admin.id
      }
    }),
    prisma.organizationalPerformanceReport.create({
      data: {
        year: 2024,
        total_employees: 6,
        average_attendance_rate: 91.2,
        average_skp_progress: 89.5,
        overall_performance_score: 90.35,
        predicate: 'SANGAT_BAIK',
        summary: 'Tahun 2024 menunjukkan peningkatan signifikan dalam kinerja organisasi. Tingkat kehadiran meningkat dan pencapaian SKP lebih optimal dibandingkan tahun sebelumnya.',
        recommendations: 'Pertahankan momentum positif dan terus tingkatkan inovasi dalam pelayanan. Fokus pada pengembangan kapasitas SDM dan digitalisasi proses kerja.',
        created_by: admin.id
      }
    })
  ])

  console.log('✅ Database seeding completed successfully!')
  console.log(`
📊 Seeded data summary:
- Users: 6 (1 Admin, 2 Supervisors, 3 Staff)
- Profiles: 6 complete profiles
- SK History: 5 records
- Training Records: 6 records
- Work Settings: 1 configuration
- Attendance: ${attendanceData.length} records (30 days for 6 users)
- Performance Reports: 2 reports
- Approvals: 2 approval records
- SKP Monthly Entries: ${skpEntries.length} entries
- SKP Monthly Files: ${sampleFiles.length} files
- SKP Monthly Behavior Entries: ${behaviorEntries.length} behavior records
- Annual Performance Reports: ${annualReports.length} reports (2023-2024)
- Supervisor Evaluations: ${supervisorEvaluations.length} evaluations
- Digital Signatures: ${digitalSignatures.length} signatures
- Organizational Performance Reports: 2 reports (2023-2024)
  `)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })