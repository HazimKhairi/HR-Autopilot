// Add Ahmad's Resume
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Adding Ahmad's resume...");

  const ahmad = await prisma.employee.findUnique({
    where: { email: "ahmad@company.com" }
  });

  if (!ahmad) {
    console.log("❌ Ahmad not found");
    return;
  }

  const resume = await prisma.resume.upsert({
    where: { employeeId: ahmad.id },
    update: {
      phone: "+60-19-876-5432",
      summary: "Marketing Manager with 5 years of experience in digital marketing, brand strategy, and campaign management across Southeast Asia.",
      skills: JSON.stringify(["Digital Marketing", "SEO/SEM", "Social Media Management", "Content Strategy", "Brand Management", "Analytics", "Email Marketing", "Campaign Management"]),
      experience: JSON.stringify([
        { role: "Marketing Manager", company: "BrandWorks Malaysia", duration: "2022 - Present" },
        { role: "Marketing Specialist", company: "Digital Agency Pro", duration: "2020 - 2022" },
        { role: "Marketing Coordinator", company: "Creative Solutions Ltd", duration: "2019 - 2020" }
      ]),
      education: JSON.stringify([
        { degree: "Bachelor of Marketing", school: "Universiti Utara Malaysia", year: "2019" },
        { degree: "Diploma in Business", school: "KL Commerce Academy", year: "2017" }
      ]),
      resumeText: `Ahmad - Marketing Manager
Marketing Manager with 5+ years of experience in digital marketing and brand strategy.
Skills: Digital Marketing, SEO/SEM, Social Media Management, Content Strategy, Brand Management
Experience:
- Marketing Manager at BrandWorks Malaysia (2022-Present)
- Marketing Specialist at Digital Agency Pro (2020-2022)
- Marketing Coordinator at Creative Solutions Ltd (2019-2020)
Education:
- Bachelor of Marketing from Universiti Utara Malaysia (2019)
- Diploma in Business from KL Commerce Academy (2017)`
    },
    create: {
      employeeId: ahmad.id,
      phone: "+60-19-876-5432",
      summary: "Marketing Manager with 5 years of experience in digital marketing, brand strategy, and campaign management across Southeast Asia.",
      skills: JSON.stringify(["Digital Marketing", "SEO/SEM", "Social Media Management", "Content Strategy", "Brand Management", "Analytics", "Email Marketing", "Campaign Management"]),
      experience: JSON.stringify([
        { role: "Marketing Manager", company: "BrandWorks Malaysia", duration: "2022 - Present" },
        { role: "Marketing Specialist", company: "Digital Agency Pro", duration: "2020 - 2022" },
        { role: "Marketing Coordinator", company: "Creative Solutions Ltd", duration: "2019 - 2020" }
      ]),
      education: JSON.stringify([
        { degree: "Bachelor of Marketing", school: "Universiti Utara Malaysia", year: "2019" },
        { degree: "Diploma in Business", school: "KL Commerce Academy", year: "2017" }
      ]),
      resumeText: `Ahmad - Marketing Manager
Marketing Manager with 5+ years of experience in digital marketing and brand strategy.
Skills: Digital Marketing, SEO/SEM, Social Media Management, Content Strategy, Brand Management
Experience:
- Marketing Manager at BrandWorks Malaysia (2022-Present)
- Marketing Specialist at Digital Agency Pro (2020-2022)
- Marketing Coordinator at Creative Solutions Ltd (2019-2020)
Education:
- Bachelor of Marketing from Universiti Utara Malaysia (2019)
- Diploma in Business from KL Commerce Academy (2017)`
    }
  });

  console.log("✅ Ahmad's resume saved successfully!");
  console.log(JSON.stringify(resume, null, 2));
}

main()
  .catch(e => console.error("❌ Error:", e))
  .finally(() => prisma.$disconnect());
