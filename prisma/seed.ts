import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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
  
  // Create attendance for last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    for (const user of users) {
      const checkIn = new Date(date)
      checkIn.setHours(8, Math.floor(Math.random() * 30), 0, 0) // 08:00-08:30
      
      const checkOut = new Date(date)
      checkOut.setHours(17, Math.floor(Math.random() * 30), 0, 0) // 17:00-17:30
      
      const statuses = ['PRESENT', 'LATE', 'EARLY_LEAVE']
      const status = i % 10 === 0 ? 'LATE' : (i % 15 === 0 ? 'EARLY_LEAVE' : 'PRESENT')
      
      attendanceData.push({
        user_id: user.id,
        attendance_date: date,
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
  
  const skpEntries = await Promise.all([
    prisma.skpMonthlyEntry.create({
      data: {
        user_id: staff1.id,
        month: 1,
        year: 2025,
        sequence_no: 1,
        indicator: 'Mengembangkan sistem informasi kepegawaian',
        action_plan: 'Analisis kebutuhan, desain sistem, dan implementasi',
        target_realization: 'Sistem selesai 100% sesuai timeline',
        supporting_data: 'Dokumentasi analisis dan hasil testing',
        feedback: 'Sistem berjalan dengan baik',
        status: 'APPROVED',
        created_by: staff1.id,
        supervisor_id: supervisor1.id
      }
    }),
    prisma.skpMonthlyEntry.create({
      data: {
        user_id: staff1.id,
        month: 1,
        year: 2025,
        sequence_no: 2,
        indicator: 'Memberikan pelatihan IT kepada pegawai',
        action_plan: 'Menyiapkan materi dan melaksanakan pelatihan',
        target_realization: '20 pegawai terlatih',
        supporting_data: 'Daftar hadir dan evaluasi pelatihan',
        feedback: 'Pelatihan berjalan lancar',
        status: 'SUBMITTED',
        created_by: staff1.id,
        supervisor_id: supervisor1.id
      }
    }),
    prisma.skpMonthlyEntry.create({
      data: {
        user_id: staff2.id,
        month: 1,
        year: 2025,
        sequence_no: 1,
        indicator: 'Menyusun laporan keuangan bulanan',
        action_plan: 'Mengumpulkan data dan menyusun laporan',
        target_realization: 'Laporan selesai tepat waktu',
        supporting_data: 'Laporan keuangan dan supporting documents',
        feedback: 'Laporan akurat dan tepat waktu',
        status: 'APPROVED',
        created_by: staff2.id,
        supervisor_id: supervisor1.id
      }
    })
  ])

  // Create SKP Monthly Files
  await prisma.skpMonthlyFile.createMany({
    data: [
      {
        entry_id: skpEntries[0].id,
        file_name: 'dokumentasi_sistem_jan2025.pdf',
        original_name: 'Dokumentasi Sistem Januari 2025.pdf',
        file_path: '/uploads/skp/dokumentasi_sistem_jan2025.pdf',
        file_type: 'application/pdf',
        file_size: 2048576
      },
      {
        entry_id: skpEntries[1].id,
        file_name: 'daftar_hadir_pelatihan.pdf',
        original_name: 'Daftar Hadir Pelatihan IT.pdf',
        file_path: '/uploads/skp/daftar_hadir_pelatihan.pdf',
        file_type: 'application/pdf',
        file_size: 1024768
      },
      {
        entry_id: skpEntries[2].id,
        file_name: 'laporan_keuangan_jan2025.xlsx',
        original_name: 'Laporan Keuangan Januari 2025.xlsx',
        file_path: '/uploads/skp/laporan_keuangan_jan2025.xlsx',
        file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        file_size: 3072384
      }
    ]
  })

  console.log('✅ Database seeding completed successfully!')

  // 9. Create Organizational Performance Reports
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
- SKP Monthly Entries: 3 entries
- SKP Monthly Files: 3 files
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