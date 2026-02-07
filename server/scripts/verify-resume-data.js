// Verify Resume Data
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("📋 Checking Resume Data in Database...\n");

  const resumes = await prisma.resume.findMany({
    include: {
      employee: {
        select: { name: true, email: true }
      }
    }
  });

  if (resumes.length === 0) {
    console.log("❌ No resumes found in database");
    return;
  }

  console.log(`✅ Found ${resumes.length} resumes\n`);

  resumes.forEach((resume, index) => {
    console.log(`Resume ${index + 1}:`);
    console.log(`  Employee: ${resume.employee.name} (${resume.employee.email})`);
    console.log(`  Phone: ${resume.phone}`);
    console.log(`  Summary: ${resume.summary?.substring(0, 80)}...`);
    
    if (resume.skills) {
      const skills = JSON.parse(resume.skills);
      console.log(`  Skills (${skills.length}): ${skills.slice(0, 3).join(", ")}...`);
    }
    
    if (resume.experience) {
      const exp = JSON.parse(resume.experience);
      console.log(`  Experience (${exp.length} roles): ${exp[0]?.role} at ${exp[0]?.company}`);
    }
    
    if (resume.education) {
      const edu = JSON.parse(resume.education);
      console.log(`  Education (${edu.length} degrees): ${edu[0]?.degree}`);
    }
    
    console.log(`  Updated: ${resume.updatedAt}\n`);
  });
}

main()
  .catch(e => console.error("❌ Error:", e))
  .finally(() => prisma.$disconnect());
