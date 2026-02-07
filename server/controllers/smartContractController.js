const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getMedian = (values) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
};

const getStats = (values) => {
  if (values.length === 0) {
    return { average: 0, median: 0, min: 0, max: 0 };
  }
  const total = values.reduce((sum, v) => sum + v, 0);
  const average = Math.round(total / values.length);
  const median = getMedian(values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { average, median, min, max };
};

const getSimilarity = (candidate, employee) => {
  let score = 0;
  const reasons = [];
  if (employee.role === candidate.role) {
    score += 60;
    reasons.push('Same role');
  } else {
    score += 20;
    reasons.push('Related role');
  }
  if (employee.country === candidate.country) {
    score += 30;
    reasons.push('Same country');
  }
  const salaryDiff = Math.abs(employee.salary - candidate.salary);
  const salaryBonus = Math.max(0, 20 - Math.round(salaryDiff / 500));
  if (salaryBonus > 0) {
    score += salaryBonus;
    reasons.push('Similar salary band');
  }
  return { similarity: Math.min(100, score), reasons };
};

const buildRecommendation = (target, band) => {
  const bandMin = typeof band?.min === 'number' ? band.min : 0;
  const bandMax = typeof band?.max === 'number' ? band.max : Number.MAX_SAFE_INTEGER;
  const clampedTarget = clamp(target, bandMin, bandMax);
  const min = clamp(Math.round(clampedTarget * 0.97), bandMin, bandMax);
  const max = clamp(Math.round(clampedTarget * 1.03), bandMin, bandMax);
  const adjustedMin = Math.min(min, clampedTarget);
  const adjustedMax = Math.max(max, clampedTarget);
  return { minimum: adjustedMin, target: clampedTarget, maximum: adjustedMax };
};

const checkEquity = (recommendedSalary, candidateRole, employees) => {
  const sameRole = employees.filter((employee) => employee.role === candidateRole);
  if (sameRole.length === 0) {
    return {
      status: 'PASS',
      compressionRisk: 'none',
      impactedEmployees: [],
      message: 'No internal benchmarks available for this role',
    };
  }
  const maxRoleSalary = Math.max(...sameRole.map((employee) => employee.salary));
  if (recommendedSalary > maxRoleSalary * 1.1) {
    return {
      status: 'WARNING',
      compressionRisk: 'high',
      impactedEmployees: sameRole
        .filter((employee) => employee.salary <= recommendedSalary)
        .map((employee) => ({
          name: employee.name,
          issue: 'Recommended salary exceeds current role maximum',
        })),
      message: 'Recommendation exceeds current role salary ceiling',
    };
  }
  if (recommendedSalary > maxRoleSalary) {
    return {
      status: 'WARNING',
      compressionRisk: 'medium',
      impactedEmployees: sameRole
        .filter((employee) => employee.salary <= recommendedSalary)
        .map((employee) => ({
          name: employee.name,
          issue: 'Recommendation higher than current top salary',
        })),
      message: 'Potential salary compression for this role',
    };
  }
  return {
    status: 'PASS',
    compressionRisk: 'none',
    impactedEmployees: [],
    message: 'No equity issues detected',
  };
};

exports.analyzeSmartContract = async (req, res) => {
  try {
    const { email, salaryBand } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const candidate = await prisma.employee.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const employees = await prisma.employee.findMany({
      where: { id: { not: candidate.id } },
    });

    const matches = employees.map((employee) => {
      const { similarity, reasons } = getSimilarity(candidate, employee);
      return {
        employeeId: employee.id,
        name: employee.name,
        similarity,
        salary: employee.salary,
        reasons,
      };
    });

    const sortedMatches = matches.sort((a, b) => b.similarity - a.similarity);
    const topMatches = sortedMatches.slice(0, 5);
    const salaryPool = (topMatches.length > 0 ? topMatches : matches).map((m) => m.salary);
    const stats = getStats(salaryPool.length > 0 ? salaryPool : [candidate.salary]);
    const baseTarget = stats.median || candidate.salary;
    const recommendation = buildRecommendation(baseTarget, salaryBand);

    const equity = checkEquity(recommendation.target, candidate.role, employees);

    const reasoning = [
      stats.median ? `Median salary of similar staff is ${stats.median}` : 'Using candidate salary as baseline',
      salaryBand?.min || salaryBand?.max ? 'Recommendation adjusted to salary band limits' : 'No salary band limits provided',
      equity.status === 'PASS' ? 'Equity check passed' : equity.message,
    ];

    return res.json({
      success: true,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        role: candidate.role,
        salary: candidate.salary,
        country: candidate.country,
      },
      comparisons: {
        matches: topMatches,
        stats,
      },
      recommendation: {
        ...recommendation,
        reasoning,
        confidence: Math.min(95, 70 + Math.round((topMatches.length / 5) * 20)),
      },
      equity,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze smart contract',
      message: error.message,
    });
  }
};
