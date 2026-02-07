// Script to add a new Marketing Manager employee with all related records
// Run with: node scripts/add-marketing-manager.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("📝 Adding new Marketing Manager employee...");

  try {
    // Create new Marketing Manager employee
    const employee = await prisma.employee.create({
      data: {
        name: "Priya Sharma",
        email: "priya.sharma@company.com",
        role: "Marketing Manager",
        salary: 9000,
        country: "Malaysia",
        leaveBalance: 14,
        visaExpiryDate: null,
      },
    });
    console.log(`✅ Created employee: ${employee.name} (${employee.email})`);

    // Create resume for the Marketing Manager
    const resume = await prisma.resume.create({
      data: {
        employeeId: employee.id,
        phone: "+60-19-876-5432",
        summary:
          "Experienced Marketing Manager with 7 years of expertise in digital marketing, brand strategy, campaign management, and team leadership.",
        skills: JSON.stringify([
          "Digital Marketing",
          "Brand Strategy",
          "Content Marketing",
          "Social Media Management",
          "SEO/SEM",
          "Marketing Analytics",
          "Campaign Management",
          "Team Leadership",
          "Google Analytics",
          "HubSpot",
        ]),
        experience: JSON.stringify([
          {
            role: "Senior Marketing Manager",
            company: "BrandWorks Malaysia",
            duration: "2021 - Present",
          },
          {
            role: "Marketing Manager",
            company: "Digital Solutions Asia",
            duration: "2019 - 2021",
          },
          {
            role: "Marketing Specialist",
            company: "Creative Agency KL",
            duration: "2017 - 2019",
          },
        ]),
        education: JSON.stringify([
          {
            degree: "Master of Business Administration (MBA)",
            school: "University of Malaya",
            year: "2019",
          },
          {
            degree: "Bachelor of Marketing",
            school: "Taylors University",
            year: "2017",
          },
        ]),
        resumeText: `Priya Sharma - Marketing Manager
Senior Marketing Manager with 7+ years of experience in digital marketing and brand strategy.
Skills: Digital Marketing, Brand Strategy, Content Marketing, Social Media Management, SEO/SEM, Marketing Analytics, Campaign Management, Team Leadership, Google Analytics, HubSpot
Experience:
- Senior Marketing Manager at BrandWorks Malaysia (2021-Present)
- Marketing Manager at Digital Solutions Asia (2019-2021)
- Marketing Specialist at Creative Agency KL (2017-2019)
Education:
- Master of Business Administration (MBA) from University of Malaya (2019)
- Bachelor of Marketing from Taylors University (2017)`,
        extractedData: JSON.stringify({
          fullName: "Priya Sharma",
          role: "Senior Marketing Manager",
          yearsOfExperience: 7,
          keySkills: [
            "Digital Marketing",
            "Brand Strategy",
            "Campaign Management",
          ],
          currentCompany: "BrandWorks Malaysia",
        }),
      },
    });
    console.log(`✅ Created resume for Priya Sharma`);

    // Create policy record (if needed)
    const marketingPolicy = await prisma.policy.create({
      data: {
        content:
          "Marketing Department: All marketing materials must be approved by the Marketing Manager before publication. Campaign budgets over RM5,000 require CFO approval.",
      },
    });
    console.log(`✅ Created marketing policy`);

    console.log("🎉 Successfully added new Marketing Manager with all records!");
    console.log(`\nEmployee Details:`);
    console.log(`- Name: ${employee.name}`);
    console.log(`- Email: ${employee.email}`);
    console.log(`- Role: ${employee.role}`);
    console.log(`- Salary: RM${employee.salary} (Monthly)`);
    console.log(`- Country: ${employee.country}`);
    console.log(`- Leave Balance: ${employee.leaveBalance} days`);
  } catch (error) {
    console.error("❌ Error adding Marketing Manager:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
