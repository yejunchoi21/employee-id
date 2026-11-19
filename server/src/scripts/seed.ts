import { connectMongo } from '../db/connect.js'
import { hashPassword } from '../auth/password.js'
import { Company, Membership } from '../models/index.js'
import { ensureDefaultDepartments } from '../services/ensureDefaultDepartments.js'

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

  const seededMembers = [
    {
      authUserId: 'seed-admin-northline',
      email: 'admin@northline.co',
      displayName: 'Northline Admin',
      role: 'admin' as const,
    },
    {
      authUserId: 'seed-member-northline',
      email: 'member@northline.co',
      displayName: 'Northline Member',
      role: 'member' as const,
    },
  ]

  for (const member of seededMembers) {
    await Membership.findOneAndUpdate(
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
  console.log('Seeded memberships (dev passwords):')
  console.log(`  admin@northline.co / ${DEFAULT_PASSWORD} (admin)`)
  console.log(`  member@northline.co / ${DEFAULT_PASSWORD} (member)`)

  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
