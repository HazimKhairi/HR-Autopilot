// PHASE 3: Proactive Compliance Intelligence Controller
// Purpose: Monitor and alert for upcoming visa expirations
// Checks for any compliance issues before they become problems

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Check for Upcoming Expirations
 * @route GET /api/compliance/check
 * @returns {Array} - List of compliance alerts
 */
async function checkExpirations(req, res) {
  try {
    console.log('🔍 Checking for compliance issues...');

    // Calculate the date 90 days from now
    // We create a new Date object representing "Right Now"
    const today = new Date();
    
    // We create another Date object for the future
    const ninetyDaysFromNow = new Date();
    // We add 90 days to the current date
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    // Query database for employees with visas expiring within 90 days
    // Prisma makes this easy: we just describe what we want.
    const employees = await prisma.employee.findMany({
      where: {
        visaExpiryDate: {
          not: null, // 1. Only check employees who HAVE a visa expiry date
          lte: ninetyDaysFromNow, // 2. "lte" means "Less Than or Equal". So, dates BEFORE or ON the 90-day mark.
        },
      },
      orderBy: {
        visaExpiryDate: 'asc', // Order by date, ascending (so closest expiry appears first)
      },
    });

    console.log(`📊 Found ${employees.length} employees with upcoming expirations`);

    // Generate compliance alerts for each employee
    const alerts = employees.map(employee => {
      // Calculate days until expiration
      // Math details:
      // 1. Subtract dates: (Expiry - Today) gives difference in Milliseconds
      // 2. Divide by ms in a day: (1000ms * 60s * 60m * 24h) = 86,400,000 ms/day
      // 3. Math.ceil: Round up to the nearest whole number
      const daysUntilExpiry = Math.ceil(
        (employee.visaExpiryDate - today) / (1000 * 60 * 60 * 24)
      );

      // Determine severity level
      let severity = 'info';
      if (daysUntilExpiry <= 30) {
        severity = 'critical'; // Red alert: Less than 30 days
      } else if (daysUntilExpiry <= 60) {
        severity = 'warning'; // Orange alert: Less than 60 days
      }

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        role: employee.role,
        country: employee.country,
        expiryDate: employee.visaExpiryDate,
        daysUntilExpiry,
        severity,
        message: `WARNING: ${employee.name}'s Visa expires in ${daysUntilExpiry} days.`,
        actionRequired: daysUntilExpiry <= 30 
          ? 'URGENT: Immediate renewal required' 
          : 'Schedule renewal soon',
      };
    });

    // Calculate summary statistics
    const summary = {
      totalAlerts: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warnings: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
    };

    console.log('✅ Compliance check completed', summary);

    // Return the compliance report
    res.json({
      success: true,
      summary,
      alerts,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error checking expirations:', error.message);
    res.status(500).json({ 
      error: 'Failed to check expirations',
      message: error.message 
    });
  }
}

/**
 * Get Detailed Employee Compliance Info
 * @route GET /api/compliance/employee/:id
 */
async function getEmployeeCompliance(req, res) {
  try {
    const { id } = req.params;
    
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const today = new Date();
    const hasVisa = employee.visaExpiryDate !== null;
    
    let complianceStatus = {
      employeeId: employee.id,
      employeeName: employee.name,
      hasVisa,
      isCompliant: true,
      daysUntilExpiry: null,
      recommendations: [],
    };

    if (hasVisa) {
      const daysUntilExpiry = Math.ceil(
        (employee.visaExpiryDate - today) / (1000 * 60 * 60 * 24)
      );

      complianceStatus.daysUntilExpiry = daysUntilExpiry;
      complianceStatus.visaExpiryDate = employee.visaExpiryDate;

      if (daysUntilExpiry <= 0) {
        complianceStatus.isCompliant = false;
        complianceStatus.recommendations.push('CRITICAL: Visa has expired! Immediate action required.');
      } else if (daysUntilExpiry <= 30) {
        complianceStatus.isCompliant = false;
        complianceStatus.recommendations.push('Start visa renewal process immediately.');
      } else if (daysUntilExpiry <= 90) {
        complianceStatus.recommendations.push('Start preparing renewal documents.');
      }
    }

    res.json({
      success: true,
      compliance: complianceStatus,
    });
  } catch (error) {
    console.error('❌ Error getting employee compliance:', error.message);
    res.status(500).json({ 
      error: 'Failed to get employee compliance',
      message: error.message 
    });
  }
}

module.exports = {
  checkExpirations,
  getEmployeeCompliance,
};
