import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

import { connectDB } from '../configs/db.js'
import { AdminProfile } from '../models/AdminProfile.js'
import { AuthSession } from '../models/AuthSession.js'
import { Department } from '../models/Department.js'
import { Request } from '../models/Request.js'
import { RequestComment } from '../models/RequestComment.js'
import { RequestUpdate } from '../models/RequestUpdate.js'
import { StudentProfile } from '../models/StudentProfile.js'
import { SuperAdminProfile } from '../models/SuperAdminProfile.js'
import { User } from '../models/User.js'
import { WorkflowConfig } from '../models/WorkflowConfig.js'

const PASSWORDS = {
  SUPER_ADMIN: 'SuperAdmin@123',
  ADMIN: 'Admin@12345',
  DEPARTMENT_ADMIN: 'DeptAdmin@123',
  HOD: 'Hod@12345',
  TEACHER: 'Teacher@123',
  STUDENT: 'Student@123',
}

const departmentSeeds = [
  { code: 'CSE', name: 'Computer Science and Engineering' },
  { code: 'ECE', name: 'Electronics and Communication Engineering' },
  { code: 'ME', name: 'Mechanical Engineering' },
]

const hodSeeds = [
  {
    name: 'Dr. Nandita Rao',
    email: 'hod.cse@unifycampus.edu',
    departmentCode: 'CSE',
    employeeId: 'EMP-HOD-CSE-001',
  },
  {
    name: 'Dr. Vivek Mehta',
    email: 'hod.ece@unifycampus.edu',
    departmentCode: 'ECE',
    employeeId: 'EMP-HOD-ECE-001',
  },
  {
    name: 'Dr. Suraj Kulkarni',
    email: 'hod.me@unifycampus.edu',
    departmentCode: 'ME',
    employeeId: 'EMP-HOD-ME-001',
  },
]

const departmentAdminSeeds = [
  {
    name: 'Ritika Sen',
    email: 'deptadmin.cse@unifycampus.edu',
    departmentCode: 'CSE',
    employeeId: 'EMP-DEP-CSE-001',
  },
  {
    name: 'Aman Verma',
    email: 'deptadmin.ece@unifycampus.edu',
    departmentCode: 'ECE',
    employeeId: 'EMP-DEP-ECE-001',
  },
]

const teacherSeeds = [
  { name: 'Prof. Arjun Sethi', email: 'teacher.cse1@unifycampus.edu', departmentCode: 'CSE', employeeId: 'EMP-TCH-CSE-001' },
  { name: 'Prof. Meera Joshi', email: 'teacher.cse2@unifycampus.edu', departmentCode: 'CSE', employeeId: 'EMP-TCH-CSE-002' },
  { name: 'Prof. Karan Bhatt', email: 'teacher.cse3@unifycampus.edu', departmentCode: 'CSE', employeeId: 'EMP-TCH-CSE-003' },
  { name: 'Prof. Sana Kapoor', email: 'teacher.cse4@unifycampus.edu', departmentCode: 'CSE', employeeId: 'EMP-TCH-CSE-004' },
  { name: 'Prof. Isha Nair', email: 'teacher.ece1@unifycampus.edu', departmentCode: 'ECE', employeeId: 'EMP-TCH-ECE-001' },
  { name: 'Prof. Rohan Pillai', email: 'teacher.ece2@unifycampus.edu', departmentCode: 'ECE', employeeId: 'EMP-TCH-ECE-002' },
  { name: 'Prof. Dev Malhotra', email: 'teacher.ece3@unifycampus.edu', departmentCode: 'ECE', employeeId: 'EMP-TCH-ECE-003' },
  { name: 'Prof. Neha Tiwari', email: 'teacher.me1@unifycampus.edu', departmentCode: 'ME', employeeId: 'EMP-TCH-ME-001' },
  { name: 'Prof. Rahul Das', email: 'teacher.me2@unifycampus.edu', departmentCode: 'ME', employeeId: 'EMP-TCH-ME-002' },
  { name: 'Prof. Tanvi Bhosle', email: 'teacher.me3@unifycampus.edu', departmentCode: 'ME', employeeId: 'EMP-TCH-ME-003' },
]

const studentFirstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Krish', 'Rohan', 'Kabir', 'Ishaan', 'Atharv', 'Yash', 'Dhruv',
  'Ananya', 'Diya', 'Aadhya', 'Myra', 'Saanvi', 'Kiara', 'Riya', 'Prisha', 'Anika', 'Tara',
]

const studentLastNames = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Kapoor', 'Gupta', 'Mishra', 'Kulkarni',
  'Joshi', 'Bose', 'Mehta', 'Jain', 'Malik', 'Pillai', 'Das', 'Saxena', 'Agarwal', 'Chawla',
]

const requestTypes = ['ACADEMIC', 'FINANCE', 'HOSTEL', 'INFRASTRUCTURE', 'OTHER']
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const statuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'RESOLVED']
const programsByDepartment = {
  CSE: 'B.Tech CSE',
  ECE: 'B.Tech ECE',
  ME: 'B.Tech Mechanical',
}

const requestTitleTemplates = {
  ACADEMIC: [
    'Need re-evaluation for {topic}',
    'Attendance shortage issue in {topic}',
    'Lab internal marks clarification for {topic}',
  ],
  FINANCE: [
    'Scholarship amount not credited for semester {semester}',
    'Tuition receipt mismatch for semester {semester}',
    'Fee payment portal dispute for {topic}',
  ],
  HOSTEL: [
    'Hostel room maintenance request for {topic}',
    'Mess quality grievance related to {topic}',
    'Room allocation complaint for {topic}',
  ],
  INFRASTRUCTURE: [
    'Classroom equipment issue in {topic}',
    'Campus network outage affecting {topic}',
    'Laboratory hardware failure in {topic}',
  ],
  OTHER: [
    'General support request regarding {topic}',
    'Administrative grievance related to {topic}',
    'Student services complaint for {topic}',
  ],
}

const requestTopics = [
  'Operating Systems', 'Signals Lab', 'Machine Design Lab', 'Scholarship Portal',
  'Hostel Block C', 'Seminar Hall 2', 'Wi-Fi Access', 'Fee Reconciliation',
  'Project Review', 'Timetable Clash', 'Internship Approval', 'Library Access',
]

const createObjectId = () => new mongoose.Types.ObjectId()

const daysAgo = (count) => {
  const date = new Date()
  date.setDate(date.getDate() - count)
  return date
}

const hoursAfter = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000)

const buildPasswordHashMap = async () => {
  const entries = await Promise.all(
    Object.entries(PASSWORDS).map(async ([role, password]) => [role, await bcrypt.hash(password, 12)]),
  )

  return Object.fromEntries(entries)
}

const buildUserDoc = ({ name, email, role, department, departmentId, passwordHashes, createdAt }) => ({
  _id: createObjectId(),
  name,
  email,
  passwordHash: passwordHashes[role],
  role,
  department: department || null,
  departmentId: departmentId || null,
  isActive: true,
  createdAt,
  updatedAt: createdAt,
})

const getDepartmentActor = ({ role, departmentCode, actors }) => {
  if (role === 'SUPER_ADMIN') {
    return actors.superAdmin
  }

  if (role === 'HOD') {
    return actors.hodsByDepartment[departmentCode]
  }

  if (role === 'DEPARTMENT_ADMIN') {
    return actors.departmentAdminsByDepartment[departmentCode] || actors.adminByDepartment[departmentCode]
  }

  if (role === 'TEACHER') {
    const teachers = actors.teachersByDepartment[departmentCode] || []
    return teachers[0] || null
  }

  return null
}

const buildWorkflowDocs = ({ departmentsByCode }) => {
  const docs = []

  for (const department of Object.values(departmentsByCode)) {
    docs.push({
      _id: createObjectId(),
      requestType: 'ACADEMIC',
      departmentId: department._id,
      steps: [
        { role: 'TEACHER', order: 1 },
        { role: 'HOD', order: 2 },
        { role: 'DEPARTMENT_ADMIN', order: 3 },
      ],
      isActive: true,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(7),
    })

    docs.push({
      _id: createObjectId(),
      requestType: 'HOSTEL',
      departmentId: department._id,
      steps: [
        { role: 'HOD', order: 1 },
        { role: 'DEPARTMENT_ADMIN', order: 2 },
      ],
      isActive: true,
      createdAt: daysAgo(58),
      updatedAt: daysAgo(6),
    })
  }

  docs.push(
    {
      _id: createObjectId(),
      requestType: 'FINANCE',
      departmentId: null,
      steps: [
        { role: 'DEPARTMENT_ADMIN', order: 1 },
        { role: 'SUPER_ADMIN', order: 2 },
      ],
      isActive: true,
      createdAt: daysAgo(55),
      updatedAt: daysAgo(5),
    },
    {
      _id: createObjectId(),
      requestType: 'INFRASTRUCTURE',
      departmentId: null,
      steps: [
        { role: 'TEACHER', order: 1 },
        { role: 'DEPARTMENT_ADMIN', order: 2 },
      ],
      isActive: true,
      createdAt: daysAgo(54),
      updatedAt: daysAgo(4),
    },
    {
      _id: createObjectId(),
      requestType: 'OTHER',
      departmentId: null,
      steps: [
        { role: 'HOD', order: 1 },
        { role: 'SUPER_ADMIN', order: 2 },
      ],
      isActive: true,
      createdAt: daysAgo(53),
      updatedAt: daysAgo(3),
    },
  )

  return docs
}

const findWorkflow = ({ workflowsByTypeAndDepartment, type, departmentId }) => {
  const key = `${type}:${String(departmentId || 'GLOBAL')}`
  return workflowsByTypeAndDepartment[key] || workflowsByTypeAndDepartment[`${type}:GLOBAL`]
}

const buildApprovalHistory = ({ workflow, departmentCode, status, actors, baseDate, requestIndex }) => {
  const history = []

  if (status === 'PENDING') {
    return history
  }

  if (status === 'IN_PROGRESS') {
    if (requestIndex % 2 === 0) {
      return history
    }

    const firstStep = workflow.steps[0]
    const actor = getDepartmentActor({ role: firstStep.role, departmentCode, actors })

    if (actor) {
      history.push({
        actorId: actor._id,
        role: firstStep.role,
        action: 'APPROVED',
        remark: `Initial ${firstStep.role.toLowerCase()} review completed.`,
        timestamp: hoursAfter(baseDate, 18),
      })
    }

    return history
  }

  if (status === 'RESOLVED') {
    workflow.steps.forEach((step, index) => {
      const actor = getDepartmentActor({ role: step.role, departmentCode, actors })
      if (!actor) return

      history.push({
        actorId: actor._id,
        role: step.role,
        action: 'APPROVED',
        remark: `Resolved at ${step.role.toLowerCase()} step.`,
        timestamp: hoursAfter(baseDate, 16 + index * 12),
      })
    })

    return history
  }

  if (status === 'REJECTED') {
    const rejectionStepIndex = workflow.steps.length > 1 && requestIndex % 2 === 0 ? 1 : 0

    workflow.steps.slice(0, rejectionStepIndex).forEach((step, index) => {
      const actor = getDepartmentActor({ role: step.role, departmentCode, actors })
      if (!actor) return

      history.push({
        actorId: actor._id,
        role: step.role,
        action: 'APPROVED',
        remark: `Escalated beyond ${step.role.toLowerCase()} review.`,
        timestamp: hoursAfter(baseDate, 12 + index * 12),
      })
    })

    const rejectedStep = workflow.steps[rejectionStepIndex]
    const rejectedBy = getDepartmentActor({ role: rejectedStep.role, departmentCode, actors })
    if (rejectedBy) {
      history.push({
        actorId: rejectedBy._id,
        role: rejectedStep.role,
        action: 'REJECTED',
        remark: 'Rejected due to insufficient supporting details.',
        timestamp: hoursAfter(baseDate, 24 + rejectionStepIndex * 10),
      })
    }
  }

  return history
}

const buildRequestBody = ({ type, semester, topic, studentName, departmentName, requestIndex }) => {
  const templates = requestTitleTemplates[type]
  const title = templates[requestIndex % templates.length]
    .replace('{topic}', topic)
    .replace('{semester}', String(semester))

  return {
    title,
    description: `Submitted by ${studentName} from ${departmentName}. The grievance concerns ${topic} and requires operational follow-up with realistic audit visibility.`,
  }
}

const buildRequestArtifacts = ({ students, workflows, actors, departmentsByCode }) => {
  const requests = []
  const updates = []
  const comments = []
  const workflowsByTypeAndDepartment = Object.fromEntries(
    workflows.map((workflow) => [
      `${workflow.requestType}:${String(workflow.departmentId || 'GLOBAL')}`,
      workflow,
    ]),
  )

  let requestCounter = 0

  students.forEach((student, studentIndex) => {
    const departmentCode = student.departmentCode
    const department = departmentsByCode[departmentCode]

    for (let ticketIndex = 0; ticketIndex < 2; ticketIndex += 1) {
      const type = requestTypes[(studentIndex + ticketIndex) % requestTypes.length]
      const priority = priorities[(studentIndex + ticketIndex) % priorities.length]
      const status = statuses[(studentIndex + ticketIndex) % statuses.length]
      const workflow = findWorkflow({
        workflowsByTypeAndDepartment,
        type,
        departmentId: department._id,
      })
      const topic = requestTopics[(studentIndex + ticketIndex) % requestTopics.length]
      const baseDate = daysAgo(90 - ((studentIndex * 2 + ticketIndex) % 75))
      const history = buildApprovalHistory({
        workflow,
        departmentCode,
        status,
        actors,
        baseDate,
        requestIndex: requestCounter,
      })

      let currentStep = 1
      let assignedTo = getDepartmentActor({
        role: workflow.steps[0].role,
        departmentCode,
        actors,
      })?._id || null

      if (status === 'IN_PROGRESS' && history.length > 0) {
        currentStep = Math.min(history.length + 1, workflow.steps.length)
        assignedTo = getDepartmentActor({
          role: workflow.steps[currentStep - 1].role,
          departmentCode,
          actors,
        })?._id || assignedTo
      }

      if (status === 'RESOLVED') {
        currentStep = workflow.steps.length
        assignedTo = null
      }

      if (status === 'REJECTED') {
        const rejectionStep = history.findIndex((entry) => entry.action === 'REJECTED')
        currentStep = rejectionStep >= 0 ? rejectionStep + 1 : 1
        assignedTo = null
      }

      const requestBody = buildRequestBody({
        type,
        semester: 3 + (studentIndex % 5),
        topic,
        studentName: student.name,
        departmentName: department.name,
        requestIndex: requestCounter,
      })

      const requestId = createObjectId()
      const teacherPool = actors.teachersByDepartment[departmentCode]
      const taggedTeacher = teacherPool[(studentIndex + ticketIndex) % teacherPool.length]
      const createdAt = baseDate
      const updatedAt = history.length
        ? history[history.length - 1].timestamp
        : hoursAfter(baseDate, status === 'PENDING' ? 2 : 6)

      requests.push({
        _id: requestId,
        studentId: student._id,
        title: requestBody.title,
        description: requestBody.description,
        type,
        priority,
        status,
        assignedTo,
        departmentId: department._id,
        currentStep,
        workflowId: workflow._id,
        taggedTeacherId: taggedTeacher?._id || null,
        approvalHistory: history,
        attachments: requestCounter % 4 === 0 ? [`https://demo.unifycampus.edu/files/request-${requestCounter + 1}.pdf`] : [],
        createdAt,
        updatedAt,
      })

      updates.push({
        _id: createObjectId(),
        requestId,
        actorId: student._id,
        action: 'CREATED',
        meta: { status: 'PENDING', title: requestBody.title },
        createdAt,
      })

      if (status !== 'PENDING') {
        updates.push({
          _id: createObjectId(),
          requestId,
          actorId: assignedTo || history[0]?.actorId || actors.superAdmin._id,
          action: 'ASSIGNED',
          meta: {
            assignedTo: String(assignedTo || history[0]?.actorId || ''),
            workflowStep: currentStep,
          },
          createdAt: hoursAfter(createdAt, 4),
        })
      }

      if (status === 'IN_PROGRESS') {
        updates.push({
          _id: createObjectId(),
          requestId,
          actorId: history[0]?.actorId || assignedTo || actors.superAdmin._id,
          action: 'STATUS_CHANGED',
          meta: { oldStatus: 'PENDING', newStatus: 'IN_PROGRESS' },
          createdAt: hoursAfter(createdAt, 6),
        })
      }

      if (status === 'RESOLVED' || status === 'REJECTED') {
        updates.push({
          _id: createObjectId(),
          requestId,
          actorId: history[history.length - 1]?.actorId || actors.superAdmin._id,
          action: 'STATUS_CHANGED',
          meta: {
            oldStatus: 'IN_PROGRESS',
            newStatus: status,
            workflowAction: status === 'RESOLVED' ? 'APPROVE' : 'REJECT',
          },
          createdAt: updatedAt,
        })
      }

      if (requestCounter % 3 === 0) {
        comments.push({
          _id: createObjectId(),
          requestId,
          senderId: student._id,
          message: 'Adding a follow-up note with supporting context for faster resolution.',
          createdAt: hoursAfter(createdAt, 8),
        })
      }

      if (requestCounter % 5 === 0) {
        comments.push({
          _id: createObjectId(),
          requestId,
          senderId: assignedTo || actors.superAdmin._id,
          message: 'Support team acknowledged the request and started internal review.',
          createdAt: hoursAfter(createdAt, 14),
        })
      }

      requestCounter += 1
    }
  })

  return { requests, updates, comments }
}

const seedDatabase = async () => {
  await connectDB()

  try {
    await mongoose.connection.db.dropDatabase()
    console.log('🧹 Dropped existing project database')

    const passwordHashes = await buildPasswordHashMap()
    const now = new Date()

    const departmentDocs = departmentSeeds.map((department, index) => ({
      _id: createObjectId(),
      name: department.name,
      code: department.code,
      hodId: null,
      teachers: [],
      createdAt: daysAgo(120 - index),
      updatedAt: daysAgo(12 - index),
    }))

    await Department.insertMany(departmentDocs)

    const departmentsByCode = Object.fromEntries(
      departmentDocs.map((department) => [department.code, department]),
    )

    const superAdmin = buildUserDoc({
      name: 'Platform Super Admin',
      email: 'superadmin@unifycampus.edu',
      role: 'SUPER_ADMIN',
      passwordHashes,
      createdAt: daysAgo(110),
    })

    const admin = buildUserDoc({
      name: 'Operations Admin',
      email: 'admin.operations@unifycampus.edu',
      role: 'ADMIN',
      department: departmentsByCode.ME.name,
      departmentId: departmentsByCode.ME._id,
      passwordHashes,
      createdAt: daysAgo(108),
    })

    const hodUsers = hodSeeds.map((seed, index) =>
      buildUserDoc({
        name: seed.name,
        email: seed.email,
        role: 'HOD',
        department: departmentsByCode[seed.departmentCode].name,
        departmentId: departmentsByCode[seed.departmentCode]._id,
        passwordHashes,
        createdAt: daysAgo(105 - index),
      }),
    )

    const departmentAdminUsers = departmentAdminSeeds.map((seed, index) =>
      buildUserDoc({
        name: seed.name,
        email: seed.email,
        role: 'DEPARTMENT_ADMIN',
        department: departmentsByCode[seed.departmentCode].name,
        departmentId: departmentsByCode[seed.departmentCode]._id,
        passwordHashes,
        createdAt: daysAgo(102 - index),
      }),
    )

    const teacherUsers = teacherSeeds.map((seed, index) =>
      buildUserDoc({
        name: seed.name,
        email: seed.email,
        role: 'TEACHER',
        department: departmentsByCode[seed.departmentCode].name,
        departmentId: departmentsByCode[seed.departmentCode]._id,
        passwordHashes,
        createdAt: daysAgo(100 - index),
      }),
    )

    const studentUsers = Array.from({ length: 50 }, (_value, index) => {
      const departmentCode = departmentSeeds[index % departmentSeeds.length].code
      const firstName = studentFirstNames[index % studentFirstNames.length]
      const lastName = studentLastNames[(index * 3) % studentLastNames.length]
      const serial = String(index + 1).padStart(2, '0')
      const name = `${firstName} ${lastName}`

      return {
        ...buildUserDoc({
          name,
          email: `student${serial}@unifycampus.edu`,
          role: 'STUDENT',
          department: departmentsByCode[departmentCode].name,
          departmentId: departmentsByCode[departmentCode]._id,
          passwordHashes,
          createdAt: daysAgo(95 - (index % 20)),
        }),
        departmentCode,
      }
    })

    await User.insertMany([superAdmin, admin, ...hodUsers, ...departmentAdminUsers, ...teacherUsers, ...studentUsers])

    const hodsByDepartment = Object.fromEntries(
      hodUsers.map((user, index) => [hodSeeds[index].departmentCode, user]),
    )
    const departmentAdminsByDepartment = Object.fromEntries(
      departmentAdminUsers.map((user, index) => [departmentAdminSeeds[index].departmentCode, user]),
    )
    const adminByDepartment = { ME: admin }
    const teachersByDepartment = teacherSeeds.reduce((acc, seed, index) => {
      acc[seed.departmentCode] = acc[seed.departmentCode] || []
      acc[seed.departmentCode].push(teacherUsers[index])
      return acc
    }, {})

    const departmentUpdates = departmentSeeds.map((seed) => ({
      updateOne: {
        filter: { _id: departmentsByCode[seed.code]._id },
        update: {
          $set: {
            hodId: hodsByDepartment[seed.code]._id,
            teachers: (teachersByDepartment[seed.code] || []).map((teacher) => teacher._id),
            updatedAt: now,
          },
        },
      },
    }))

    await Department.bulkWrite(departmentUpdates)

    await SuperAdminProfile.create({
      userId: superAdmin._id,
      employeeId: 'EMP-SUPER-001',
      scope: 'GLOBAL',
      accessLevel: 'ROOT',
      managedModules: ['USERS', 'WORKFLOWS', 'DEPARTMENTS', 'ESCALATIONS', 'REPORTS'],
      createdAt: daysAgo(109),
      updatedAt: daysAgo(2),
    })

    await AdminProfile.insertMany([
      {
        userId: admin._id,
        employeeId: 'EMP-ADMIN-001',
        department: departmentsByCode.ME.name,
        designation: 'Other',
        permissions: ['REQUEST_REVIEW', 'REQUEST_ASSIGN', 'REQUEST_STATUS_UPDATE', 'DASHBOARD_VIEW', 'USER_MANAGE'],
        isSuperAdmin: false,
        createdAt: daysAgo(108),
        updatedAt: daysAgo(1),
      },
      ...departmentAdminUsers.map((user, index) => ({
        userId: user._id,
        employeeId: departmentAdminSeeds[index].employeeId,
        department: user.department,
        designation: 'Class Coordinator',
        permissions: ['REQUEST_REVIEW', 'REQUEST_ASSIGN', 'REQUEST_STATUS_UPDATE', 'DASHBOARD_VIEW'],
        isSuperAdmin: false,
        createdAt: daysAgo(101 - index),
        updatedAt: daysAgo(2),
      })),
      ...hodUsers.map((user, index) => ({
        userId: user._id,
        employeeId: hodSeeds[index].employeeId,
        department: user.department,
        designation: 'Professor',
        permissions: ['REQUEST_REVIEW', 'REQUEST_ASSIGN', 'REQUEST_STATUS_UPDATE', 'DASHBOARD_VIEW'],
        isSuperAdmin: false,
        createdAt: daysAgo(104 - index),
        updatedAt: daysAgo(2),
      })),
    ])

    await StudentProfile.insertMany(
      studentUsers.map((student, index) => ({
        userId: student._id,
        universityId: `UNI2026${String(index + 1).padStart(4, '0')}`,
        department: student.department,
        program: programsByDepartment[student.departmentCode],
        batch: index % 2 === 0 ? '2023-2027' : '2024-2028',
        semester: 3 + (index % 5),
        phone: `+91-98${String(10000000 + index).slice(-8)}`,
        isVerified: index % 7 !== 0,
        createdAt: daysAgo(94 - (index % 15)),
        updatedAt: daysAgo(index % 10),
      })),
    )

    const workflowDocs = buildWorkflowDocs({ departmentsByCode })
    await WorkflowConfig.insertMany(workflowDocs)

    const actors = {
      superAdmin,
      hodsByDepartment,
      departmentAdminsByDepartment,
      adminByDepartment,
      teachersByDepartment,
    }

    const { requests, updates, comments } = buildRequestArtifacts({
      students: studentUsers,
      workflows: workflowDocs,
      actors,
      departmentsByCode,
    })

    await Request.insertMany(requests)
    await RequestUpdate.insertMany(updates)
    await RequestComment.insertMany(comments)
    await AuthSession.deleteMany({})

    console.log('✅ Enterprise demo database seeded successfully')
    console.log(`   Departments: ${departmentDocs.length}`)
    console.log(`   Users: ${1 + 1 + hodUsers.length + departmentAdminUsers.length + teacherUsers.length + studentUsers.length}`)
    console.log(`   Workflows: ${workflowDocs.length}`)
    console.log(`   Requests: ${requests.length}`)
    console.log(`   Request updates: ${updates.length}`)
    console.log(`   Request comments: ${comments.length}`)
  } finally {
    await mongoose.disconnect()
  }
}

seedDatabase().catch((error) => {
  console.error('❌ Failed to reset and seed database:', error)
  process.exit(1)
})
