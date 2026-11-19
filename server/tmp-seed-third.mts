import { connectMongo } from "./src/db/connect.js";
import { hashPassword } from "./src/auth/password.js";
import { Company, Membership, Employee } from "./src/models/index.js";
import { ensureDefaultDepartments } from "./src/services/ensureDefaultDepartments.js";
import { nextEmployeeCode } from "./src/utils/employeeCode.js";
import { initialsFromName } from "./src/utils/initials.js";

await connectMongo();
const company = await Company.findOne({ slug: "northline-collective" });
if (!company) throw new Error("company missing");
const departments = await ensureDefaultDepartments(company._id);
const eng = departments.find((d) => d.name === "Engineering") ?? departments[0];
const passwordHash = await hashPassword("Northline!Dev1");
const membership = await Membership.findOneAndUpdate(
  { authUserId: "seed-third-northline" },
  {
    companyId: company._id,
    email: "third@northline.co",
    displayName: "Northline Third",
    role: "member",
    authUserId: "seed-third-northline",
    passwordHash,
  },
  { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
);
let employee = await Employee.findOne({ companyId: company._id, email: "third@northline.co" });
if (!employee) {
  employee = await Employee.create({
    companyId: company._id,
    departmentId: eng._id,
    approvalStatus: "approved",
    employeeCode: await nextEmployeeCode(company._id),
    name: "Northline Third",
    title: "Analyst",
    initials: initialsFromName("Northline Third"),
    office: "Remote",
    joined: "Jan 2025",
    email: "third@northline.co",
    phone: "+1 (206) 555-0199",
    manager: "Northline Admin",
    bio: "Third-party access probe account.",
    skills: ["QA"],
    submittedByMembershipId: membership._id,
    approvedByMembershipId: membership._id,
    approvedAt: new Date(),
  });
} else {
  employee.approvalStatus = "approved";
  await employee.save();
}
console.log(JSON.stringify({ ok: true, membershipId: String(membership._id), employeeId: String(employee._id) }));
process.exit(0);
