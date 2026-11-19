import { randomUUID } from 'node:crypto'
import { connectMongo } from '../db/connect.js'
import { hashPassword } from '../auth/password.js'
import { Company, Employee, Membership } from '../models/index.js'
import { ensureDefaultDepartments } from '../services/ensureDefaultDepartments.js'
import { nextEmployeeCode } from '../utils/employeeCode.js'
import { initialsFromName } from '../utils/initials.js'

function readArg(flag: string) {
  const prefix = `${flag}=`
  const hit = process.argv.find((arg) => arg.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : undefined
}

function usage() {
  console.log(`Usage:
  npm run bootstrap-admin -- --email=admin@example.com --password=YourTempPass1 --name="Admin Name"

Creates the first company admin only when no admin membership exists yet.
Also creates/links an approved employee profile for that email.
`)
}

async function main() {
  const email = readArg('--email')?.trim().toLowerCase()
  const password = readArg('--password')
  const name = readArg('--name')?.trim() || 'Company Admin'

  if (!email || !password || password.length < 8) {
    usage()
    process.exit(1)
  }

  await connectMongo()

  const existingAdmin = await Membership.findOne({ role: 'admin' }).lean()
  if (existingAdmin) {
    console.error(
      `An admin already exists (${existingAdmin.email}). Refusing to bootstrap another.`,
    )
    process.exit(1)
  }

  const company = await Company.findOneAndUpdate(
    { slug: 'northline-collective' },
    {
      name: 'Northline Collective',
      slug: 'northline-collective',
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )

  if (!company) {
    throw new Error('Failed to ensure company')
  }

  const departments = await ensureDefaultDepartments(company._id)
  const engineering =
    departments.find((department) => department.name === 'Engineering') ??
    departments[0]
  if (!engineering) {
    throw new Error('No departments available')
  }

  const passwordHash = await hashPassword(password)
  const membership = await Membership.create({
    companyId: company._id,
    email,
    displayName: name,
    role: 'admin',
    mustChangePassword: true,
    authUserId: `admin-${randomUUID()}`,
    passwordHash,
  })

  let employee = await Employee.findOne({
    companyId: company._id,
    email,
  })

  if (!employee) {
    employee = await Employee.create({
      companyId: company._id,
      departmentId: engineering._id,
      approvalStatus: 'approved',
      employeeCode: await nextEmployeeCode(company._id),
      name,
      title: 'Directory Administrator',
      initials: initialsFromName(name),
      office: 'Headquarters',
      joined: new Date().toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      email,
      phone: '+1 (000) 000-0000',
      manager: 'Executive team',
      bio: 'Bootstrap admin account for directory management.',
      skills: ['Approvals', 'Directory ops'],
      submittedByMembershipId: membership._id,
      approvedByMembershipId: membership._id,
      approvedAt: new Date(),
    })
  } else if (employee.approvalStatus !== 'approved') {
    employee.approvalStatus = 'approved'
    employee.approvedByMembershipId = membership._id
    employee.approvedAt = new Date()
    await employee.save()
  }

  membership.employeeId = employee._id
  await membership.save()

  console.log('Bootstrap admin created.')
  console.log(`  email: ${email}`)
  console.log(`  role: admin`)
  console.log(`  mustChangePassword: true`)
  console.log('Sign in, then change the temporary password immediately.')
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
