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
  const password1 = await bcrypt.hash('effmuhammad', 10)
  const password2 = await bcrypt.hash('andrialfian', 10)
  const password3 = await bcrypt.hash('rifkypratama', 10)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { nip: '199001012020121001' },
    update: {},
    create: {
      nip: '199001012020121001',
      name: 'Effry Muhammad',
      email: 'effmuhammad@primaasn.go.id',
      password: password1,
      role: 'ADMIN',
      work_unit: 'Biro Kepegawaian',
      position: 'Administrator Sistem',
      grade: 'III/c',
      employment_status: 'PNS'
    }
  })

  // Create supervisor user
  const supervisor = await prisma.user.upsert({
    where: { nip: '199002022021121002' },
    update: {},
    create: {
      nip: '199002022021121002',
      name: 'Andri Alfian',
      email: 'andrialfian@primaasn.go.id',
      password: password2,
      role: 'SUPERVISOR',
      work_unit: 'Kementrian Perhubungan',
      position: 'Kepala Bagian',
      grade: 'III/d',
      employment_status: 'PNS'
    }
  })

  // Create regular employee user
  const employee = await prisma.user.upsert({
    where: { nip: '199003032022121003' },
    update: {},
    create: {
      nip: '199003032022121003',
      name: 'Rifky Pratama',
      email: 'rifkypratama@primaasn.go.id',
      password: password3,
      role: 'STAFF',
      work_unit: 'Kementrian Perhubungan',
      position: 'Staf',
      grade: 'III/a',
      employment_status: 'PNS',
      supervisor_id: supervisor.id
    }
  })

  // Create default work settings
  const workSettings = await prisma.workSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      work_start_time: '08:00',
      work_end_time: '17:00',
      late_tolerance_minutes: 0,
      is_active: true
    }
  })

  console.log('Seeded users:')
  console.log('- Admin:', admin)
  console.log('- Supervisor:', supervisor)
  console.log('- Employee:', employee)
  console.log('Seeded work settings:', workSettings)
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