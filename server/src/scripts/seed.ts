import { connectMongo } from '../db/connect.js'
import { hashPassword } from '../auth/password.js'
import { Company, Employee, Membership } from '../models/index.js'
import { ensureDefaultDepartments } from '../services/ensureDefaultDepartments.js'
import { nextEmployeeCode } from '../utils/employeeCode.js'
import { initialsFromName } from '../utils/initials.js'

const DEFAULT_PASSWORD = 'Northline!Dev1'

async function seed() {
  await connectMongo()

  const company = await Company.findOneAndUpdate(
    { slug: 'northline-collective' },
    {
      name: 'Northline Collective',
      slug: 'northline-collective',
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )

  if (!company) {
    throw new Error('Failed to seed company')
  }

  const departments = await ensureDefaultDepartments(company._id)
  const passwordHash = await hashPassword(DEFAULT_PASSWORD)
  const engineering =
    departments.find((department) => department.name === 'Engineering') ??
    departments[0]

  if (!engineering) {
    throw new Error('No departments available for seed employees')
  }

  const seededMembers = [
    {
      authUserId: 'seed-admin-northline',
      email: 'admin@northline.co',
      displayName: 'Northline Admin',
      role: 'admin' as const,
      title: 'Directory Administrator',
      office: 'Seattle',
      phone: '+1 (206) 555-0100',
      manager: 'Executive team',
      bio: 'Owns directory approvals and company memberships.',
      skills: ['Approvals', 'Directory ops', 'Access control'],
    },
    {
      authUserId: 'seed-member-northline',
      email: 'member@northline.co',
      displayName: 'Northline Member',
      role: 'member' as const,
      title: 'Operations Specialist',
      office: 'Austin',
      phone: '+1 (512) 555-0101',
      manager: 'Northline Admin',
      bio: 'Helps teammates with day-to-day directory questions.',
      skills: ['Onboarding', 'People ops', 'Help desk'],
    },
  ]

  for (const member of seededMembers) {
    const membership = await Membership.findOneAndUpdate(
      { authUserId: member.authUserId },
      {
        companyId: company._id,
        email: member.email,
        displayName: member.displayName,
        role: member.role,
        authUserId: member.authUserId,
        passwordHash,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    )

    if (!membership) {
      throw new Error(`Failed to seed membership for ${member.email}`)
    }

    const existingEmployee = await Employee.findOne({
      companyId: company._id,
      email: member.email,
    })

    if (existingEmployee) {
      existingEmployee.departmentId = engineering._id
      existingEmployee.approvalStatus = 'approved'
      existingEmployee.name = member.displayName
      existingEmployee.title = member.title
      existingEmployee.initials = initialsFromName(member.displayName)
      existingEmployee.office = member.office
      existingEmployee.joined = existingEmployee.joined || 'Jan 2024'
      existingEmployee.phone = member.phone
      existingEmployee.manager = member.manager
      existingEmployee.bio = member.bio
      existingEmployee.skills = member.skills
      existingEmployee.submittedByMembershipId = membership._id
      existingEmployee.approvedByMembershipId = membership._id
      existingEmployee.approvedAt = existingEmployee.approvedAt ?? new Date()
      await existingEmployee.save()
    } else {
      await Employee.create({
        companyId: company._id,
        departmentId: engineering._id,
        approvalStatus: 'approved',
        employeeCode: await nextEmployeeCode(company._id),
        name: member.displayName,
        title: member.title,
        initials: initialsFromName(member.displayName),
        office: member.office,
        joined: 'Jan 2024',
        email: member.email,
        phone: member.phone,
        manager: member.manager,
        bio: member.bio,
        skills: member.skills,
        submittedByMembershipId: membership._id,
        approvedByMembershipId: membership._id,
        approvedAt: new Date(),
      })
    }
  }

  console.log('Seeded company:', {
    id: String(company._id),
    name: company.name,
    slug: company.slug,
  })
  console.log(
    'Departments:',
    departments.map((department) => ({
      id: String(department._id),
      name: department.name,
    })),
  )
  console.log('Seeded memberships + approved employees (dev passwords):')
  console.log(`  admin@northline.co / ${DEFAULT_PASSWORD} (admin)`)
  console.log(`  member@northline.co / ${DEFAULT_PASSWORD} (member)`)

  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
