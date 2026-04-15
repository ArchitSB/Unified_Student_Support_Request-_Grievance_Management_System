import bcrypt from 'bcryptjs'

import { connectDB } from '../configs/db.js'
import { AdminProfile } from '../models/AdminProfile.js'
import { Department } from '../models/Department.js'
import { Request } from '../models/Request.js'
import { RequestUpdate } from '../models/RequestUpdate.js'
import { StudentProfile } from '../models/StudentProfile.js'
import { SuperAdminProfile } from '../models/SuperAdminProfile.js'
import { User } from '../models/User.js'
import { WorkflowConfig } from '../models/WorkflowConfig.js'

const upsertDepartment = async ({ name, code, hodId = null, teachers = [] }) => {
  const existing = await Department.findOne({ code })

  if (existing) {
    existing.name = name
    existing.hodId = hodId
    existing.teachers = teachers
    await existing.save()
    return existing
  }

  return Department.create({
    name,
    code,
    hodId,
    teachers,
  })
}

const upsertWorkflowConfig = async ({ requestType, departmentId = null, steps }) => {
  const existing = await WorkflowConfig.findOne({ requestType, departmentId: departmentId || null })

  if (existing) {
    existing.steps = steps
    existing.isActive = true
    await existing.save()
    return existing
  }

  return WorkflowConfig.create({
    requestType,
    departmentId: departmentId || null,
    steps,
    isActive: true,
  })
}

const upsertUser = async ({ name, email, password, role, department = null, departmentId = null }) => {
  const existing = await User.findOne({ email })
  const passwordHash = await bcrypt.hash(password, 12)

  if (existing) {
    existing.name = name
    existing.passwordHash = passwordHash
    existing.role = role
    existing.department = department
    existing.departmentId = departmentId
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
    departmentId,
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

const upsertSuperAdminProfile = async (userId, profile = {}) => {
  await SuperAdminProfile.updateOne(
    { userId },
    {
      $set: {
        employeeId: profile.employeeId,
        scope: 'GLOBAL',
        accessLevel: profile.accessLevel || 'ROOT',
        managedModules: profile.managedModules || ['USERS', 'WORKFLOWS', 'DEPARTMENTS', 'ESCALATIONS', 'REPORTS'],
      },
    },
    { upsert: true },
  )
}

const upsertRequest = async ({
  studentId,
  assignedTo,
  title,
  description,
  type,
  priority,
  status,
  departmentId,
  currentStep,
  workflowId,
  taggedTeacherId,
  approvalHistory = [],
}) => {
  const existing = await Request.findOne({ title, studentId })

  if (existing) {
    existing.description = description
    existing.type = type
    existing.priority = priority
    existing.status = status
    existing.assignedTo = assignedTo || null
    existing.departmentId = departmentId || null
    existing.currentStep = currentStep || 1
    existing.workflowId = workflowId || null
    existing.taggedTeacherId = taggedTeacherId || null
    existing.approvalHistory = approvalHistory
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
    departmentId: departmentId || null,
    currentStep: currentStep || 1,
    workflowId: workflowId || null,
    taggedTeacherId: taggedTeacherId || null,
    approvalHistory,
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

  const csDepartment = await upsertDepartment({
    name: 'Computer Science',
    code: 'CSE',
  })

  const mechDepartment = await upsertDepartment({
    name: 'Mechanical Engineering',
    code: 'ME',
  })

  const superAdmin = await upsertUser({
    name: 'Platform Super Admin',
    email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@university.edu',
    password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
    role: 'SUPER_ADMIN',
  })

  const admin = await upsertUser({
    name: process.env.ADMIN_NAME || 'System Admin',
    email: process.env.ADMIN_EMAIL || 'admin@university.edu',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    role: 'ADMIN',
    department: process.env.ADMIN_DEPARTMENT || 'Computer Science',
    departmentId: csDepartment._id,
  })

  const departmentAdmin = await upsertUser({
    name: 'Department Admin',
    email: process.env.DEPARTMENT_ADMIN_EMAIL || 'deptadmin@university.edu',
    password: process.env.DEPARTMENT_ADMIN_PASSWORD || 'DeptAdmin@123',
    role: 'DEPARTMENT_ADMIN',
    department: 'Computer Science',
    departmentId: csDepartment._id,
  })

  const teacher = await upsertUser({
    name: 'Faculty Mentor',
    email: process.env.TEACHER_EMAIL || 'teacher@university.edu',
    password: process.env.TEACHER_PASSWORD || 'Teacher@123',
    role: 'TEACHER',
    department: 'Computer Science',
    departmentId: csDepartment._id,
  })

  const hod = await upsertUser({
    name: 'Head of Department',
    email: process.env.HOD_EMAIL || 'hod@university.edu',
    password: process.env.HOD_PASSWORD || 'Hod@12345',
    role: 'HOD',
    department: 'Computer Science',
    departmentId: csDepartment._id,
  })

  await upsertDepartment({
    name: 'Computer Science',
    code: 'CSE',
    hodId: hod._id,
    teachers: [teacher._id],
  })

  await upsertAdminProfile(admin._id, {
    employeeId: process.env.ADMIN_EMPLOYEE_ID || 'EMP-ADMIN-001',
    department: admin.department || 'Computer Science',
    designation: 'Other',
    permissions: ['REQUEST_REVIEW', 'REQUEST_ASSIGN', 'REQUEST_STATUS_UPDATE', 'DASHBOARD_VIEW', 'USER_MANAGE'],
    isSuperAdmin: false,
  })

  await upsertAdminProfile(departmentAdmin._id, {
    employeeId: process.env.DEPARTMENT_ADMIN_EMPLOYEE_ID || 'EMP-DEP-001',
    department: departmentAdmin.department || 'Computer Science',
    designation: 'Class Coordinator',
    permissions: ['REQUEST_REVIEW', 'REQUEST_ASSIGN', 'REQUEST_STATUS_UPDATE', 'DASHBOARD_VIEW'],
    isSuperAdmin: false,
  })

  await upsertAdminProfile(hod._id, {
    employeeId: process.env.HOD_EMPLOYEE_ID || 'EMP-HOD-001',
    department: hod.department || 'Computer Science',
    designation: 'Professor',
    permissions: ['REQUEST_REVIEW', 'REQUEST_STATUS_UPDATE', 'DASHBOARD_VIEW'],
    isSuperAdmin: false,
  })

  await AdminProfile.deleteOne({ userId: superAdmin._id })
  await upsertSuperAdminProfile(superAdmin._id, {
    employeeId: process.env.SUPER_ADMIN_EMPLOYEE_ID || 'EMP-SUPER-001',
    accessLevel: 'ROOT',
    managedModules: ['USERS', 'WORKFLOWS', 'DEPARTMENTS', 'ESCALATIONS', 'REPORTS'],
  })

  const studentOne = await upsertUser({
    name: 'Aarav Sharma',
    email: process.env.SEED_STUDENT1_EMAIL || 'student1@university.edu',
    password: process.env.SEED_STUDENT1_PASSWORD || 'Student@123',
    role: 'STUDENT',
    department: 'Computer Science',
    departmentId: csDepartment._id,
  })

  const studentTwo = await upsertUser({
    name: 'Mira Kapoor',
    email: process.env.SEED_STUDENT2_EMAIL || 'student2@university.edu',
    password: process.env.SEED_STUDENT2_PASSWORD || 'Student@123',
    role: 'STUDENT',
    department: 'Mechanical Engineering',
    departmentId: mechDepartment._id,
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

  const workflowAcademicCse = await upsertWorkflowConfig({
    requestType: 'ACADEMIC',
    departmentId: csDepartment._id,
    steps: [
      { role: 'TEACHER', order: 1 },
      { role: 'HOD', order: 2 },
      { role: 'DEPARTMENT_ADMIN', order: 3 },
    ],
  })

  const workflowFinanceGlobal = await upsertWorkflowConfig({
    requestType: 'FINANCE',
    departmentId: null,
    steps: [
      { role: 'DEPARTMENT_ADMIN', order: 1 },
      { role: 'SUPER_ADMIN', order: 2 },
    ],
  })

  const workflowInfrastructureGlobal = await upsertWorkflowConfig({
    requestType: 'INFRASTRUCTURE',
    departmentId: null,
    steps: [{ role: 'DEPARTMENT_ADMIN', order: 1 }],
  })

  const requestOne = await upsertRequest({
    studentId: studentOne._id,
    assignedTo: hod._id,
    title: 'Exam re-evaluation for Algorithms paper',
    description: 'Requesting re-evaluation due to suspected totaling discrepancy.',
    type: 'ACADEMIC',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    departmentId: csDepartment._id,
    currentStep: 2,
    workflowId: workflowAcademicCse._id,
    taggedTeacherId: teacher._id,
    approvalHistory: [
      {
        actorId: teacher._id,
        role: 'TEACHER',
        action: 'APPROVED',
        remark: 'Verified and escalated to HOD',
        timestamp: new Date(),
      },
    ],
  })

  const requestTwo = await upsertRequest({
    studentId: studentTwo._id,
    assignedTo: departmentAdmin._id,
    title: 'Scholarship disbursement delay',
    description: 'Scholarship amount has not been credited despite approval email.',
    type: 'FINANCE',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    departmentId: mechDepartment._id,
    currentStep: 1,
    workflowId: workflowFinanceGlobal._id,
    approvalHistory: [],
  })

  const requestThree = await upsertRequest({
    studentId: studentOne._id,
    assignedTo: null,
    title: 'Lab equipment malfunction in CS lab',
    description: 'Multiple systems in CS lab are not booting; practical sessions impacted.',
    type: 'INFRASTRUCTURE',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    departmentId: csDepartment._id,
    currentStep: 1,
    workflowId: workflowInfrastructureGlobal._id,
    approvalHistory: [
      {
        actorId: departmentAdmin._id,
        role: 'DEPARTMENT_ADMIN',
        action: 'APPROVED',
        remark: 'Issue resolved by infra team',
        timestamp: new Date(),
      },
    ],
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
    meta: { assignedTo: String(hod._id) },
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
    actorId: departmentAdmin._id,
    action: 'STATUS_CHANGED',
    meta: { oldStatus: 'IN_PROGRESS', newStatus: 'RESOLVED' },
  })

  console.log('✅ Database seeded successfully with departments, workflows, role profiles, requests, and timelines')
  process.exit(0)
}

seedDatabase().catch((error) => {
  console.error('❌ Failed to seed database:', error.message)
  process.exit(1)
})
