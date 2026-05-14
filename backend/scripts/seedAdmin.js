import bcrypt from 'bcryptjs'

import { connectDB } from '../configs/db.js'
import { AdminProfile } from '../models/AdminProfile.js'
import { Department } from '../models/Department.js'
import { User } from '../models/User.js'

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@university.edu'
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345'
  const name = process.env.ADMIN_NAME || 'System Admin'
  const department = process.env.ADMIN_DEPARTMENT || 'Support'

  await connectDB()

  const resolvedDepartment = await Department.findOne({
    $or: [{ name: department }, { code: department.toUpperCase() }],
  })
    .select('_id name')
    .lean()

  const existingAdmin = await User.findOne({ email })

  if (existingAdmin) {
    await AdminProfile.updateOne(
      { userId: existingAdmin._id },
      {
        $set: {
          department: resolvedDepartment?.name || department,
          designation: 'Other',
          isSuperAdmin: false,
        },
      },
      { upsert: true },
    )

    console.log(`ℹ️ Admin already exists for email: ${email}`)
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await User.create({
    name,
    email,
    passwordHash,
    role: 'ADMIN',
    department: resolvedDepartment?.name || department,
    departmentId: resolvedDepartment?._id || null,
    isActive: true,
  })

  await AdminProfile.create({
    userId: admin._id,
    department: resolvedDepartment?.name || department,
    designation: 'Other',
    isSuperAdmin: false,
  })

  console.log(`✅ Admin created: ${email}`)
  process.exit(0)
}

seedAdmin().catch((error) => {
  console.error('❌ Failed to seed admin user:', error.message)
  process.exit(1)
})
