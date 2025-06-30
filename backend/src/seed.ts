import { PrismaClient, Role } from '@prisma/client'
import { hashPassword } from '../../web/src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@syb-prayer.com' },
    update: {},
    create: {
      email: 'admin@syb-prayer.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  })

  console.log('Created admin user:', admin.email)

  // Create test account
  const account = await prisma.account.upsert({
    where: { accountId: 'test-account-001' },
    update: {},
    create: {
      accountId: 'test-account-001',
      accountName: 'Test Business Account',
      isActive: true,
    },
  })

  console.log('Created test account:', account.accountName)

  // Create client user
  const clientPassword = await hashPassword('client123')
  const client = await prisma.user.upsert({
    where: { email: 'client@testbusiness.com' },
    update: {},
    create: {
      email: 'client@testbusiness.com',
      password: clientPassword,
      name: 'Client User',
      role: Role.CLIENT,
      accountId: account.id,
    },
  })

  console.log('Created client user:', client.email)

  console.log('Seeding completed!')
  console.log('\\nLogin credentials:')
  console.log('Admin: admin@syb-prayer.com / admin123')
  console.log('Client: client@testbusiness.com / client123')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })