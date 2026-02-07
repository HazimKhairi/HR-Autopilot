// Seed script: Populates the database with initial test data
// Run with: npm run seed

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data to prevent duplicates
  await prisma.resume.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.policy.deleteMany({});

  // Create multiple employees for better demo
  const employees = [
    {
      name: "Hazim",
      email: "hazim@company.com",
      role: "Software Engineer",
      salary: 8000,
      country: "Malaysia",
      leaveBalance: 12,
      visaExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      name: "Sarah",
      email: "sarah@company.com",
      role: "Product Manager",
      salary: 10000,
      country: "Singapore",
      leaveBalance: 15,
      visaExpiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
    {
      name: "Ahmad",
      email: "ahmad@company.com",
      role: "Marketing Manager",
      salary: 7500,
      country: "Malaysia",
      leaveBalance: 8,
      visaExpiryDate: null, // No visa required
    },
  ];

  for (const employeeData of employees) {
    const employee = await prisma.employee.create({ data: employeeData });
    console.log("✅ Created employee:", employee.name, `(${employee.email})`);
  }

  // Add sample resume for Hazim
  const hazimEmployee = await prisma.employee.findUnique({
    where: { email: "hazim@company.com" }
  });

  if (hazimEmployee) {
    const hazimResume = await prisma.resume.create({
      data: {
        employeeId: hazimEmployee.id,
        phone: "+60-12-345-6789",
        summary: "Experienced software engineer with 6 years of expertise in full-stack development, cloud architecture, and team leadership.",
        skills: JSON.stringify(["JavaScript", "TypeScript", "React", "Node.js", "AWS", "Docker", "SQL", "MongoDB"]),
        experience: JSON.stringify([
          { role: "Senior Software Engineer", company: "TechCorp Malaysia", duration: "2021 - Present" },
          { role: "Software Engineer", company: "Digital Solutions Inc", duration: "2019 - 2021" },
          { role: "Junior Developer", company: "StartUp Hub", duration: "2018 - 2019" }
        ]),
        education: JSON.stringify([
          { degree: "Bachelor of Computer Science", school: "University of Malaya", year: "2018" },
          { degree: "Diploma in IT", school: "Kuala Lumpur Polytechnic", year: "2016" }
        ]),
        resumeText: `Hazim - Software Engineer
Senior Software Engineer with 6+ years of experience in full-stack development.
Skills: JavaScript, TypeScript, React, Node.js, AWS, Docker, SQL, MongoDB
Experience:
- Senior Software Engineer at TechCorp Malaysia (2021-Present)
- Software Engineer at Digital Solutions Inc (2019-2021)
- Junior Developer at StartUp Hub (2018-2019)
Education:
- Bachelor of Computer Science from University of Malaya (2018)
- Diploma in IT from Kuala Lumpur Polytechnic (2016)`,
      }
    });
    console.log("✅ Created resume for Hazim");
  }

  // Add sample resume for Sarah
  const sarahEmployee = await prisma.employee.findUnique({
    where: { email: "sarah@company.com" }
  });

  if (sarahEmployee) {
    const sarahResume = await prisma.resume.create({
      data: {
        employeeId: sarahEmployee.id,
        phone: "+65-98-765-4321",
        summary: "Product Manager with 8 years of experience in agile product development, user research, and cross-functional team management.",
        skills: JSON.stringify(["Product Strategy", "User Research", "Agile/Scrum", "Data Analysis", "Figma", "SQL", "A/B Testing", "Cross-functional Leadership"]),
        experience: JSON.stringify([
          { role: "Senior Product Manager", company: "Global Tech Singapore", duration: "2020 - Present" },
          { role: "Product Manager", company: "InnovateTech", duration: "2018 - 2020" },
          { role: "Associate Product Manager", company: "WebServices Asia", duration: "2016 - 2018" }
        ]),
        education: JSON.stringify([
          { degree: "MBA in Business Administration", school: "National University of Singapore", year: "2018" },
          { degree: "Bachelor of Business", school: "Nanyang Technological University", year: "2015" }
        ]),
        resumeText: `Sarah - Product Manager
Senior Product Manager with 8+ years of experience in product development.
Skills: Product Strategy, User Research, Agile/Scrum, Data Analysis, Figma, SQL, A/B Testing
Experience:
- Senior Product Manager at Global Tech Singapore (2020-Present)
- Product Manager at InnovateTech (2018-2020)
- Associate Product Manager at WebServices Asia (2016-2018)
Education:
- MBA in Business Administration from National University of Singapore (2018)
- Bachelor of Business from Nanyang Technological University (2015)`,
      }
    });
    console.log("✅ Created resume for Sarah");
  }

  // Create Policy: Lunch allowance policy
  const policy = await prisma.policy.create({
    data: {
      content:
        "Lunch allowance is RM20 per day for all employees. This is provided as a daily meal subsidy and must be claimed through the HR portal.",
    },
  });

  console.log("✅ Created policy:", policy);

  // Create additional policies for better RAG demonstration
  const leavePolicy = await prisma.policy.create({
    data: {
      content:
        "Annual leave entitlement: Employees receive 14 days of annual leave per year. Leave must be applied at least 7 days in advance through the HR system.",
    },
  });

  const remoteWorkPolicy = await prisma.policy.create({
    data: {
      content:
        "Remote work policy: Employees may work from home up to 2 days per week with manager approval. Remote work requests must be submitted 24 hours in advance.",
    },
  });

  console.log("✅ Created additional policies");
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
