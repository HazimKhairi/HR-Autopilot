// PHASE 1: Intelligent Document Generation Controller
// Purpose: Automate employment contract creation using OpenAI

const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate Employment Contract
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

    // Construct the prompt for OpenAI
    // This prompt instructs the AI to act as a legal expert and generate
    // a contract with country-specific labor laws
    const prompt = `You are a legal expert specializing in employment law. Create a professional HTML-formatted employment contract for the following position:

Role: ${role}
Country: ${country}
Salary: ${salary} (local currency)
Employee Name: ${name}

Requirements:
1. Include specific labor laws and regulations for ${country}
2. Add standard employment clauses (probation, termination, confidentiality)
3. Make it legally sound and professional
4. Format in clean HTML with proper styling
5. Include placeholders for signatures and dates

Generate a complete, production-ready employment contract.`;

    console.log('🤖 Calling OpenAI to generate contract...');

    // Call OpenAI API to generate the contract
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o as specified
      messages: [
        {
          role: 'system',
          content: 'You are an expert legal advisor who creates employment contracts that comply with local labor laws.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7, // Balanced creativity and consistency
      max_tokens: 2000, // Allow for detailed contracts
    });

    const generatedContract = completion.choices[0].message.content;

    console.log('✅ Contract generated successfully');

    // Return the generated contract to the client
    res.json({
      success: true,
      contract: generatedContract,
      metadata: {
        employee: name,
        role,
        country,
        salary,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error generating contract:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate contract',
      message: error.message 
    });
  }
}

module.exports = {
  generateContract,
};
