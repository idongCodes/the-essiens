import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10)

  // 1. Create Admin User (Existing)
  await prisma.user.upsert({
    where: { email: 'idongesit_essien@ymail.com' },
    update: {
      password: hashedPassword
    },
    create: {
      email: 'idongesit_essien@ymail.com',
      firstName: 'Idongesit',
      lastName: 'Essien',
      alias: 'Idong',
      position: 'Creator',
      phone: '+17743126471',
      password: hashedPassword,
      posts: {
        create: {
          content: 'Welcome to the Common Room! This is the first official post.',
        },
      },
    },
  })

  console.log('Seed successful!')
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