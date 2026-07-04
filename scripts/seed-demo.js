import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("Seeding Demo Data...")
  
  // 1. Create Demo Users
  const demoGuest = await prisma.user.upsert({
    where: { email: 'guest@demo.com' },
    update: {},
    create: {
      firstName: 'Demo',
      lastName: 'Guest',
      email: 'guest@demo.com',
      password: 'demo',
      position: 'Guest',
      status: '👋 Exploring the app',
      alias: 'Guest Explorer'
    }
  })
  
  const demoAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'Demo',
      email: 'admin@demo.com',
      password: 'demo',
      position: 'Parent',
      isAdmin: true,
      status: '🛠️ Building things',
      alias: 'Family Admin'
    }
  })

  // 2. Create Demo Posts
  await prisma.post.create({
    data: {
      content: 'Welcome to the Demo! Feel free to post, comment, and explore all the features.',
      title: 'Welcome!',
      isAnnouncement: true,
      isUrgent: false,
      authorId: demoAdmin.id
    }
  })
  
  await prisma.post.create({
    data: {
      content: 'Just uploaded some new photos to the family album!',
      authorId: demoAdmin.id
    }
  })
  
  // 3. Create Demo Album Media
  await prisma.albumMedia.create({
    data: {
      url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1000&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=300&auto=format&fit=crop',
      type: 'image',
      altText: 'Family gathering',
      uploaderId: demoAdmin.id
    }
  })

  // 4. Create Demo Testimonial
  await prisma.testimonial.create({
    data: {
      content: 'This app has completely changed how our family stays connected!',
      authorId: demoGuest.id
    }
  })

  console.log("Demo Seeding Complete!")
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
