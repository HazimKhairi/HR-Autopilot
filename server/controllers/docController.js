// PHASE 1: Intelligent Document Generation Controller
// Purpose: Automate employment contract creation using Ollama (Local LLM)

const { PrismaClient } = require('@prisma/client');
const puppeteer = require('puppeteer'); // For HTML -> PDF rendering

const prisma = new PrismaClient();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3.2';

/**
 * Generate Employment Contract using Ollama
 * @route POST /api/contract/generate
 * @param {Object} data - Contract details { employeeId, customData }
 * @returns {Object} - Generated HTML contract
 */
async function generateContract(req, res) {
  try {
    const { employeeId, email, customData } = req.body;

    // If email provided, fetch employee data by email
    let employeeData;
    if (email) {
      employeeData = await prisma.employee.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!employeeData) {
        return res.status(404).json({ 
          success: false,
          error: 'Employee not found with this email address' 
        });
      }
    } else if (employeeId) {
      // Fallback to employeeId for backward compatibility
      employeeData = await prisma.employee.findUnique({
        where: { id: parseInt(employeeId) },
      });

      if (!employeeData) {
        return res.status(404).json({ 
          success: false,
          error: 'Employee not found' 
        });
      }
    } else if (customData) {
      // Use custom data if no email or employeeId provided
      employeeData = customData;
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Either email, employeeId, or customData must be provided' 
      });
    }

    const { name, role, salary, country } = employeeData;
    const effectiveDate = req.body.effectiveDate || employeeData.effectiveDate || "1 MARCH 2026";
    const workLocation = req.body.workLocation || employeeData.workLocation || "Cyberjaya, Malaysia";
    const annualLeave = "14"; // Standard for Malaysia
    const sickLeave = "14";
    
    // Construct the prompt for Ollama
    // More detailed prompt for better results with local LLM
    const prompt = `You are a legal expert specializing in employment law. Create a professional HTML-formatted employment contract.

EMPLOYMENT CONTRACT DETAILS:
- Employee Name: ${name}
- Job Role: ${role}
- Country: ${country}
- Monthly Salary: ${salary} (local currency)
- Effective Date: ${effectiveDate}
- Office Location: ${workLocation}
- Annual Leave: ${annualLeave} days
- Sick Leave: ${sickLeave} days

SPECIFIC REQUIREMENTS:
1. Generate a complete employment contract in HTML format
2. Make it compliant with labor laws of ${country}
3. Include these sections (use proper HTML tags):
   - Parties Information (Company and Employee)
   - Job Title and Description
   - Compensation and Benefits
   - Work Hours and Location
   - Leave and Vacation Policy
   - Termination Conditions
   - Confidentiality Agreement
   - Dispute Resolution
   - Signatures Section
4. Use ${country}-specific employment regulations
5. Add CSS styling for professional appearance
6. IMPORTANT: Do NOT use placeholders in [BRACKETS]. Use the specific values provided above to fill in every field.
7. If a specific detail (like a notice period) is not provided, use a standard legal default for ${country} (e.g., 30 days) instead of a placeholder.
8. Make it legally sound and professional

FORMAT REQUIREMENTS:
- Use <!DOCTYPE html>
- Include <head> with basic CSS styles
- Use semantic HTML tags (section, article, header, footer)
- Add proper indentation for readability

Generate a complete, ready-to-use employment contract in HTML format:`;

    console.log('Calling Ollama to generate contract...');
    console.log(`Using model: ${OLLAMA_CHAT_MODEL}`);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_CHAT_MODEL,
        messages: [
          { role: 'system', content: 'You are a legal expert specializing in employment law. Generate only HTML content, no explanations.' },
          { role: 'user', content: prompt },
        ],
        stream: false,
        options: {
          temperature: 0,
          num_predict: 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    let generatedContract = data.message.content;

    // Clean and format the response
    generatedContract = generatedContract.trim();
    
    console.log('✅ Contract generated successfully using Ollama');

    // Return the generated contract to the client
    res.json({
      success: true,
      contract: generatedContract,
      metadata: {
        employee: name,
        role,
        country,
        salary,
        model: OLLAMA_CHAT_MODEL,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error generating contract:', error.message);
    
    // Check if Ollama is running
    if (error.cause?.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Ollama service not running',
        message: 'Please ensure Ollama is installed and running on localhost:11434',
        instructions: [
          '1. Install Ollama: brew install ollama',
          '2. Run: ollama pull llama3.2',
          '3. Start Ollama: ollama serve',
        ]
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to generate contract',
      message: error.message 
    });
  }
}

/**
 * Generate a simple contract template (fallback if Ollama fails)
 */
async function generateTemplateContract(employeeData) {
  const { name, role, salary, country } = employeeData;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employment Contract - ${name}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 30px 0; }
        .signature { margin-top: 100px; }
        .placeholder { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <div class="header">
        <h1>EMPLOYMENT CONTRACT</h1>
        <p><strong>Date:</strong> [DATE]</p>
    </div>
    
    <div class="section">
        <h2>1. PARTIES</h2>
        <p>This Employment Contract ("Contract") is made between:</p>
        <p><strong>Employer:</strong> [COMPANY_NAME], a company registered in ${country}</p>
        <p><strong>Employee:</strong> ${name}</p>
    </div>
    
    <div class="section">
        <h2>2. POSITION AND DUTIES</h2>
        <p>The Employee is employed as: <strong>${role}</strong></p>
        <p>Location: [WORK_LOCATION]</p>
        <p>The Employee shall perform all duties associated with this position.</p>
    </div>
    
    <div class="section">
        <h2>3. COMPENSATION</h2>
        <p>Annual Salary: <strong>${salary}</strong> (${country} currency)</p>
        <p>Payment: Monthly on the last working day</p>
        <p>Benefits: As per ${country} labor laws and company policy</p>
    </div>
    
    <div class="section">
        <h2>4. WORKING HOURS</h2>
        <p>Standard work week: 40 hours</p>
        <p>Overtime: As per ${country} regulations</p>
    </div>
    
    <div class="section">
        <h2>5. TERMINATION</h2>
        <p>Notice period: As required by ${country} labor law</p>
        <p>This contract may be terminated by either party with written notice.</p>
    </div>
    
    <div class="signature">
        <p>_________________________</p>
        <p><strong>Employer Signature</strong></p>
        <p>Date: ___________________</p>
        
        <p style="margin-top: 50px;">_________________________</p>
        <p><strong>Employee Signature</strong></p>
        <p>Date: ___________________</p>
    </div>
</body>
</html>`;
}

// Render arbitrary HTML (from request body) to PDF and return as attachment
async function renderHtmlToPdf(req, res) {
  try {
    const { html, filename } = req.body;
    if (!html) return res.status(400).json({ success: false, error: 'html is required' });

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const safeName = (filename || 'document').replace(/[^a-z0-9_.-]/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('❌ renderHtmlToPdf error:', err);
    return res.status(500).json({ success: false, error: 'Failed to render PDF', message: err.message });
  }
}

module.exports = {
  generateContract,
  generateTemplateContract,
  renderHtmlToPdf,
};