// Employee Controller - Handles employee lookup operations
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Find employee by email
 * GET /api/employee/by-email/:email
 */
exports.getEmployeeByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Find employee by email
    const employee = await prisma.employee.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found with this email address",
      });
    }

    return res.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        salary: employee.salary,
        country: employee.country,
        leaveBalance: employee.leaveBalance,
        visaExpiryDate: employee.visaExpiryDate,
      },
    });
  } catch (error) {
    console.error("Error fetching employee by email:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch employee data",
    });
  }
};
