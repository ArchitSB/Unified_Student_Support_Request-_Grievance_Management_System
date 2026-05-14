import { connectDB } from '../configs/db.js'
import { ADMIN_DESIGNATIONS, AdminProfile } from '../models/AdminProfile.js'

const allowedDesignations = new Set(ADMIN_DESIGNATIONS)

const normalizeDesignation = (value) => {
  const raw = String(value || '').trim()
  const key = raw.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')

  if (!key) return 'Other'
  if (key === 'professor') return 'Professor'
  if (key === 'teacher' || key === 'faculty mentor' || key === 'faculty') return 'Teacher'
  if (key === 'class coordinator' || key === 'coordinator' || key === 'department coordinator') {
    return 'Class Coordinator'
  }

  // Legacy values from previous iterations and seeds.
  if (
    key === 'administrator' ||
    key === 'lead administrator' ||
    key === 'department administrator' ||
    key === 'head of department' ||
    key === 'super administrator'
  ) {
    return 'Other'
  }

  return 'Other'
}

const migrateAdminDesignations = async () => {
  await connectDB()

  const profiles = await AdminProfile.find({}).select('_id designation').lean()

  if (!profiles.length) {
    console.log('ℹ️ No admin profiles found. Nothing to migrate.')
    process.exit(0)
  }

  const updates = []

  for (const profile of profiles) {
    const current = profile.designation
    const normalized = normalizeDesignation(current)

    if (!allowedDesignations.has(current) || current !== normalized) {
      updates.push({
        updateOne: {
          filter: { _id: profile._id },
          update: { $set: { designation: normalized } },
        },
      })
    }
  }

  if (!updates.length) {
    console.log('✅ Admin designations are already normalized. No changes made.')
    process.exit(0)
  }

  const result = await AdminProfile.bulkWrite(updates)

  console.log(
    `✅ Migration complete: matched ${result.matchedCount}, modified ${result.modifiedCount} admin profile(s).`,
  )
  process.exit(0)
}

migrateAdminDesignations().catch((error) => {
  console.error('❌ Admin designation migration failed:', error.message)
  process.exit(1)
})
