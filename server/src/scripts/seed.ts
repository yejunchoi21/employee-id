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
        mustChangePassword: false,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    )

    if (!membership) {
      throw new Error(`Failed to seed membership for ${member.email}`)
    }

    let employee = await Employee.findOne({
      companyId: company._id,
      email: member.email,
    })

    if (employee) {
      employee.departmentId = engineering._id
      employee.approvalStatus = 'approved'
      employee.name = member.displayName
      employee.title = member.title
      employee.initials = initialsFromName(member.displayName)
      employee.office = member.office
      employee.joined = employee.joined || 'Jan 2024'
      employee.phone = member.phone
      employee.manager = member.manager
      employee.bio = member.bio
      employee.skills = member.skills
      employee.submittedByMembershipId = membership._id
      employee.approvedByMembershipId = membership._id
      employee.approvedAt = employee.approvedAt ?? new Date()
      await employee.save()
    } else {
      employee = await Employee.create({
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

    membership.employeeId = employee._id
    membership.mustChangePassword = false
    await membership.save()
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
