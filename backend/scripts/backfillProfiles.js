import { connectDB } from '../configs/db.js'
import { AdminProfile } from '../models/AdminProfile.js'
import { StudentProfile } from '../models/StudentProfile.js'
import { User } from '../models/User.js'

const backfillProfiles = async () => {
  await connectDB()

  try {
    await StudentProfile.collection.dropIndex('universityId_1')
  } catch (_error) {
    // Ignore when index is absent or already migrated.
  }

  await StudentProfile.collection.createIndex(
    { universityId: 1 },
    {
      unique: true,
      partialFilterExpression: { universityId: { $exists: true, $type: 'string' } },
    },
  )

  const users = await User.find({ isActive: true }).lean()

  let studentProfilesCreated = 0
  let adminProfilesCreated = 0

  for (const user of users) {
    if (user.role === 'STUDENT') {
      const existing = await StudentProfile.findOne({ userId: user._id }).lean()
      if (!existing) {
        await StudentProfile.create({
          userId: user._id,
          department: user.department || null,
          isVerified: false,
        })
        studentProfilesCreated += 1
      }
      continue
    }

    if (user.role === 'ADMIN') {
      const existing = await AdminProfile.findOne({ userId: user._id }).lean()
      if (!existing) {
        await AdminProfile.create({
          userId: user._id,
          department: user.department || 'Support',
          designation: 'Administrator',
          permissions: ['REQUEST_REVIEW', 'REQUEST_ASSIGN', 'REQUEST_STATUS_UPDATE', 'DASHBOARD_VIEW'],
          isSuperAdmin: false,
        })
        adminProfilesCreated += 1
      }
    }
  }

  console.log(`✅ Backfill complete: created ${studentProfilesCreated} student profile(s), ${adminProfilesCreated} admin profile(s)`) 
  process.exit(0)
}

backfillProfiles().catch((error) => {
  console.error('❌ Profile backfill failed:', error.message)
  process.exit(1)
})
