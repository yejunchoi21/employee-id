import { connectMongo } from '../db/connect.js'
import { Department, Employee, Membership } from '../models/index.js'

async function main() {
  await connectMongo()
  const membership = await Membership.findOne({ email: 'member@northline.co' })
  if (!membership) throw new Error('Missing member membership')

  const department = await Department.findOne({
    companyId: membership.companyId,
    name: 'Business',
  })
  if (!department) throw new Error('Missing Business department')

  await Employee.deleteOne({
    companyId: membership.companyId,
    email: 'reject.me@northline.co',
  })

  const employee = await Employee.create({
    companyId: membership.companyId,
    departmentId: department._id,
    approvalStatus: 'pending',
    employeeCode: `EMP-RJ-${Date.now().toString().slice(-6)}`,
    name: 'Reject Me',
    title: 'Analyst',
    initials: 'RM',
    office: 'Remote',
    joined: 'Jan 2026',
    email: 'reject.me@northline.co',
    phone: '1',
    manager: 'Boss',
    bio: 'Temp rejection fixture',
    skills: ['SQL'],
    submittedByMembershipId: membership._id,
  })

  process.stdout.write(String(employee._id))
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
