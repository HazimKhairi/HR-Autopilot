// Seed script: Populates the database with initial test data
// Run with: npm run seed

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data to prevent duplicates
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
