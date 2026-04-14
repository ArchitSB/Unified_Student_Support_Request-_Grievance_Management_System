import bcrypt from 'bcryptjs'

import { connectDB } from '../configs/db.js'
import { User } from '../models/User.js'

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@university.edu'
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345'
  const name = process.env.ADMIN_NAME || 'System Admin'
  const department = process.env.ADMIN_DEPARTMENT || 'Support'

  await connectDB()

  const existingAdmin = await User.findOne({ email })

  if (existingAdmin) {
    console.log(`ℹ️ Admin already exists for email: ${email}`)
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await User.create({
    name,
    email,
    passwordHash,
    role: 'ADMIN',
    department,
    isActive: true,
  })

  console.log(`✅ Admin created: ${email}`)
  process.exit(0)
}

seedAdmin().catch((error) => {
  console.error('❌ Failed to seed admin user:', error.message)
  process.exit(1)
})