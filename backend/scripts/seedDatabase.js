import bcrypt from 'bcryptjs'

import { connectDB } from '../configs/db.js'
import { AdminProfile } from '../models/AdminProfile.js'
import { Request } from '../models/Request.js'
import { RequestUpdate } from '../models/RequestUpdate.js'
import { StudentProfile } from '../models/StudentProfile.js'
import { User } from '../models/User.js'

const upsertUser = async ({ name, email, password, role, department = null }) => {
  const existing = await User.findOne({ email })
  const passwordHash = await bcrypt.hash(password, 12)

  if (existing) {
    existing.name = name
    existing.passwordHash = passwordHash
    existing.role = role
    existing.department = department
    existing.isActive = true
    await existing.save()
    return existing
  }

  return User.create({
    name,
    email,
    passwordHash,
    role,
    department,
    isActive: true,
  })
}

const upsertStudentProfile = async (userId, profile) => {
  await StudentProfile.updateOne(
    { userId },
    {
      $set: {
        department: profile.department,
        universityId: profile.universityId,
        program: profile.program,
        batch: profile.batch,
        semester: profile.semester,
        phone: profile.phone,
        isVerified: profile.isVerified,
      },
    },
    { upsert: true },
  )
}

const upsertAdminProfile = async (userId, profile) => {
  await AdminProfile.updateOne(
    { userId },
    {
      $set: {
        employeeId: profile.employeeId,
        department: profile.department,
        designation: profile.designation,
        permissions: profile.permissions,
        isSuperAdmin: profile.isSuperAdmin,
      },
    },
    { upsert: true },
  )
}

const upsertRequest = async ({ studentId, assignedTo, title, description, type, priority, status }) => {
  const existing = await Request.findOne({ title, studentId })

  if (existing) {
    existing.description = description
    existing.type = type
    existing.priority = priority
    existing.status = status
    existing.assignedTo = assignedTo || null
    await existing.save()
    return existing
  }

  return Request.create({
    studentId,
    title,
    description,
    type,
    priority,
    status,
    assignedTo: assignedTo || null,
  })
}

const upsertRequestUpdate = async ({ requestId, actorId, action, meta }) => {
  const existing = await RequestUpdate.findOne({ requestId, action, actorId })
  if (existing) {
    existing.meta = meta
    await existing.save()
    return existing
  }

  return RequestUpdate.create({ requestId, actorId, action, meta })
}

const seedDatabase = async () => {
  await connectDB()

  const admin = await upsertUser({
    name: process.env.ADMIN_NAME || 'System Admin',
    email: process.env.ADMIN_EMAIL || 'admin@university.edu',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    role: 'ADMIN',
    department: process.env.ADMIN_DEPARTMENT || 'Support',
  })

  await upsertAdminProfile(admin._id, {
    employeeId: process.env.ADMIN_EMPLOYEE_ID || 'EMP-ADMIN-001',
    department: admin.department || 'Support',
    designation: 'Lead Administrator',
    permissions: ['REQUEST_REVIEW', 'REQUEST_ASSIGN', 'REQUEST_STATUS_UPDATE', 'DASHBOARD_VIEW', 'USER_MANAGE'],
    isSuperAdmin: true,
  })

  const studentOne = await upsertUser({
    name: 'Aarav Sharma',
    email: process.env.SEED_STUDENT1_EMAIL || 'student1@university.edu',
    password: process.env.SEED_STUDENT1_PASSWORD || 'Student@123',
    role: 'STUDENT',
  })

  const studentTwo = await upsertUser({
    name: 'Mira Kapoor',
    email: process.env.SEED_STUDENT2_EMAIL || 'student2@university.edu',
    password: process.env.SEED_STUDENT2_PASSWORD || 'Student@123',
    role: 'STUDENT',
  })

  await upsertStudentProfile(studentOne._id, {
    department: 'Computer Science',
    universityId: 'U2023001',
    program: 'B.Tech',
    batch: '2023-2027',
    semester: 6,
    phone: '+91-9000000001',
    isVerified: true,
  })

  await upsertStudentProfile(studentTwo._id, {
    department: 'Mechanical Engineering',
    universityId: 'U2023002',
    program: 'B.Tech',
    batch: '2023-2027',
    semester: 6,
    phone: '+91-9000000002',
    isVerified: true,
  })

  const requestOne = await upsertRequest({
    studentId: studentOne._id,
    assignedTo: admin._id,
    title: 'Hostel Wi-Fi outage in Block C',
    description: 'Wi-Fi has been unavailable in Hostel Block C for the last 3 days.',
    type: 'HOSTEL',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
  })

  const requestTwo = await upsertRequest({
    studentId: studentTwo._id,
    assignedTo: null,
    title: 'Scholarship disbursement delay',
    description: 'Scholarship amount has not been credited despite approval email.',
    type: 'FINANCE',
    priority: 'URGENT',
    status: 'PENDING',
  })

  const requestThree = await upsertRequest({
    studentId: studentOne._id,
    assignedTo: admin._id,
    title: 'Lab equipment malfunction in CS lab',
    description: 'Multiple systems in CS lab are not booting; practical sessions impacted.',
    type: 'INFRASTRUCTURE',
    priority: 'MEDIUM',
    status: 'RESOLVED',
  })

  await upsertRequestUpdate({
    requestId: requestOne._id,
    actorId: studentOne._id,
    action: 'CREATED',
    meta: { status: 'PENDING' },
  })
  await upsertRequestUpdate({
    requestId: requestOne._id,
    actorId: admin._id,
    action: 'ASSIGNED',
    meta: { assignedTo: String(admin._id) },
  })
  await upsertRequestUpdate({
    requestId: requestOne._id,
    actorId: admin._id,
    action: 'STATUS_CHANGED',
    meta: { oldStatus: 'PENDING', newStatus: 'IN_PROGRESS' },
  })

  await upsertRequestUpdate({
    requestId: requestTwo._id,
    actorId: studentTwo._id,
    action: 'CREATED',
    meta: { status: 'PENDING' },
  })

  await upsertRequestUpdate({
    requestId: requestThree._id,
    actorId: studentOne._id,
    action: 'CREATED',
    meta: { status: 'PENDING' },
  })
  await upsertRequestUpdate({
    requestId: requestThree._id,
    actorId: admin._id,
    action: 'STATUS_CHANGED',
    meta: { oldStatus: 'IN_PROGRESS', newStatus: 'RESOLVED' },
  })

  console.log('✅ Database seeded successfully with users, role profiles, requests, and timelines')
  process.exit(0)
}

seedDatabase().catch((error) => {
  console.error('❌ Failed to seed database:', error.message)
  process.exit(1)
})
