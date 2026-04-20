import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const email = process.argv[2]
if (!email) { console.error('Usage: node scripts/make-admin.mjs <email>'); process.exit(1) }

const user = await prisma.user.findUnique({ where: { email } })
if (!user) { console.error('No user found with email:', email); process.exit(1) }

await prisma.user.update({ where: { email }, data: { isAdmin: true } })
console.log(`✅ ${email} is now admin (was: ${user.isAdmin})`)

const all = await prisma.user.findMany({ select: { email: true, isAdmin: true } })
console.log('All users:', JSON.stringify(all, null, 2))
await prisma.$disconnect()
