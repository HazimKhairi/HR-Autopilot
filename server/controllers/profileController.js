// Profile Controller - Handles employee profile and resume operations
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get employee profile by email (with resume data)
 * GET /api/profile/by-email/:email
 */
exports.getProfileByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const profile = await prisma.employee.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        resume: true,
      },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Employee profile not found",
      });
    }

    // Parse JSON fields in resume if they exist
    const resumeData = profile.resume ? {
      ...profile.resume,
      skills: profile.resume.skills ? JSON.parse(profile.resume.skills) : [],
      experience: profile.resume.experience ? JSON.parse(profile.resume.experience) : [],
      education: profile.resume.education ? JSON.parse(profile.resume.education) : [],
      extractedData: profile.resume.extractedData ? JSON.parse(profile.resume.extractedData) : null,
    } : null;

    return res.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        salary: profile.salary,
        country: profile.country,
        leaveBalance: profile.leaveBalance,
        visaExpiryDate: profile.visaExpiryDate,
        createdAt: profile.createdAt,
      },
      resume: resumeData,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch profile data",
    });
  }
};

/**
 * Get employee profile by ID (with resume data)
 * GET /api/profile/:id
 */
exports.getProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: {
        resume: true,
      },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Employee profile not found",
      });
    }

    const resumeData = profile.resume ? {
      ...profile.resume,
      skills: profile.resume.skills ? JSON.parse(profile.resume.skills) : [],
      experience: profile.resume.experience ? JSON.parse(profile.resume.experience) : [],
      education: profile.resume.education ? JSON.parse(profile.resume.education) : [],
      extractedData: profile.resume.extractedData ? JSON.parse(profile.resume.extractedData) : null,
    } : null;

    return res.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        salary: profile.salary,
        country: profile.country,
        leaveBalance: profile.leaveBalance,
        visaExpiryDate: profile.visaExpiryDate,
        createdAt: profile.createdAt,
      },
      resume: resumeData,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch profile data",
    });
  }
};

/**
 * Create or update resume for employee
 * POST /api/profile/:employeeId/resume
 * Body: { phone, summary, skills, experience, education, resumeText }
 */
exports.upsertResume = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { phone, summary, skills, experience, education, resumeText, extractedData } = req.body;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    // Upsert resume (create if doesn't exist, update if does)
    const resume = await prisma.resume.upsert({
      where: { employeeId: parseInt(employeeId) },
      update: {
        phone: phone || undefined,
        summary: summary || undefined,
        skills: skills ? JSON.stringify(skills) : undefined,
        experience: experience ? JSON.stringify(experience) : undefined,
        education: education ? JSON.stringify(education) : undefined,
        resumeText: resumeText || undefined,
        extractedData: extractedData ? JSON.stringify(extractedData) : undefined,
      },
      create: {
        employeeId: parseInt(employeeId),
        phone: phone || null,
        summary: summary || null,
        skills: skills ? JSON.stringify(skills) : null,
        experience: experience ? JSON.stringify(experience) : null,
        education: education ? JSON.stringify(education) : null,
        resumeText: resumeText || null,
        extractedData: extractedData ? JSON.stringify(extractedData) : null,
      },
    });

    return res.json({
      success: true,
      message: "Resume saved successfully",
      resume: {
        ...resume,
        skills: resume.skills ? JSON.parse(resume.skills) : [],
        experience: resume.experience ? JSON.parse(resume.experience) : [],
        education: resume.education ? JSON.parse(resume.education) : [],
        extractedData: resume.extractedData ? JSON.parse(resume.extractedData) : null,
      },
    });
  } catch (error) {
    console.error("Error upserting resume:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to save resume data",
    });
  }
};

/**
 * Get all employee profiles (paginated)
 * GET /api/profile?skip=0&take=10
 */
exports.getAllProfiles = async (req, res) => {
  try {
    const { skip = 0, take = 10 } = req.query;

    const profiles = await prisma.employee.findMany({
      skip: parseInt(skip),
      take: parseInt(take),
      include: {
        resume: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.employee.count();

    const profilesWithResume = profiles.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      salary: p.salary,
      country: p.country,
      leaveBalance: p.leaveBalance,
      visaExpiryDate: p.visaExpiryDate,
      hasResume: !!p.resume,
      resumeId: p.resume?.id || null,
    }));

    return res.json({
      success: true,
      data: profilesWithResume,
      pagination: {
        total,
        skip: parseInt(skip),
        take: parseInt(take),
      },
    });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch profiles",
    });
  }
};
