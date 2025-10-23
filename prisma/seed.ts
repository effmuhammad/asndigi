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
  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { nip: '199001012020121001' },
    update: {},
    create: {
      nip: '199001012020121001',
      name: 'Administrator',
      email: 'admin@asndigi.go.id',
      password: hashedPassword,
      role: 'admin',
      unit_kerja: 'Biro Kepegawaian',
      jabatan: 'Administrator Sistem',
      golongan: 'III/c',
      status_kepegawaian: 'PNS'
    }
  })

  // Create supervisor user
  const supervisor = await prisma.user.upsert({
    where: { nip: '199002022021121002' },
    update: {},
    create: {
      nip: '199002022021121002',
      name: 'Supervisor Kinerja',
      email: 'supervisor@asndigi.go.id',
      password: hashedPassword,
      role: 'supervisor',
      unit_kerja: 'Bagian Kinerja',
      jabatan: 'Kepala Bagian',
      golongan: 'III/d',
      status_kepegawaian: 'PNS'
    }
  })

  // Create regular employee user
  const employee = await prisma.user.upsert({
    where: { nip: '199003032022121003' },
    update: {},
    create: {
      nip: '199003032022121003',
      name: 'Pegawai ASN',
      email: 'pegawai@asndigi.go.id',
      password: hashedPassword,
      role: 'pegawai',
      unit_kerja: 'Bagian Umum',
      jabatan: 'Staf',
      golongan: 'III/a',
      status_kepegawaian: 'PNS',
      supervisor_id: supervisor.id
    }
  })

  console.log('Seeded users:')
  console.log('- Admin:', admin)
  console.log('- Supervisor:', supervisor)
  console.log('- Employee:', employee)
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